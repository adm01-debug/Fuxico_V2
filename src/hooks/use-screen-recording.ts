import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScreenRecording {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_ms: number;
  file_url: string;
  thumbnail_url?: string;
  views_count: number;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
}

export interface RecordingView {
  id: string;
  recording_id: string;
  viewer_email?: string;
  viewer_ip: string;
  watch_time_ms: number;
  completed: boolean;
  created_at: string;
}

export function useScreenRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<ScreenRecording[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const loadRecordings = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('screen_recordings').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (data) setRecordings(data as ScreenRecording[]);
  }, []);

  const startRecording = useCallback(async (options: { screen: boolean; camera: boolean; audio: boolean }): Promise<void> => {
    try {
      const streams: MediaStream[] = [];
      
      if (options.screen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 1920, height: 1080 }, audio: options.audio });
        streams.push(screenStream);
      }
      
      if (options.camera) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: options.audio && !options.screen });
        streams.push(cameraStream);
      }

      const combinedStream = new MediaStream();
      streams.forEach(stream => stream.getTracks().forEach(track => combinedStream.addTrack(track)));
      
      streamRef.current = combinedStream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await uploadRecording(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      toast({ title: 'Recording started' });
    } catch (error: any) {
      toast({ title: 'Failed to start recording', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast({ title: 'Recording stopped', description: 'Processing...' });
    }
  }, [isRecording, toast]);

  const uploadRecording = async (blob: Blob): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const fileName = `${user.user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from('recordings').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('recordings').getPublicUrl(fileName);

      const recording: Partial<ScreenRecording> = {
        id: crypto.randomUUID(),
        user_id: user.user.id,
        title: `Recording ${new Date().toLocaleString()}`,
        file_url: publicUrl,
        duration_ms: 0,
        views_count: 0,
        status: 'ready',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('screen_recordings').insert(recording);
      if (error) throw error;

      toast({ title: 'Recording saved' });
      await loadRecordings();
    } catch (error: any) {
      toast({ title: 'Failed to save recording', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecording = useCallback(async (recordingId: string): Promise<void> => {
    await supabase.from('screen_recordings').delete().eq('id', recordingId);
    toast({ title: 'Recording deleted' });
    await loadRecordings();
  }, [loadRecordings, toast]);

  const getRecordingLink = useCallback((recordingId: string): string => {
    return `${window.location.origin}/view/recording/${recordingId}`;
  }, []);

  const getEmbedCode = useCallback((recordingId: string): string => {
    const link = getRecordingLink(recordingId);
    return `<a href="${link}"><img src="${link}/thumbnail" alt="Video" style="max-width:100%"/></a>`;
  }, [getRecordingLink]);

  const trackView = useCallback(async (recordingId: string, watchTimeMs: number, completed: boolean): Promise<void> => {
    await supabase.from('recording_views').insert({ recording_id: recordingId, watch_time_ms: watchTimeMs, completed });
    await supabase.from('screen_recordings').update({ views_count: supabase.sql`views_count + 1` }).eq('id', recordingId);
  }, []);

  const updateRecording = useCallback(async (recordingId: string, updates: { title?: string; description?: string }): Promise<void> => {
    await supabase.from('screen_recordings').update(updates).eq('id', recordingId);
    await loadRecordings();
  }, [loadRecordings]);

  return {
    isRecording, recordings, isLoading,
    loadRecordings, startRecording, stopRecording, deleteRecording, getRecordingLink, getEmbedCode, trackView, updateRecording
  };
}
