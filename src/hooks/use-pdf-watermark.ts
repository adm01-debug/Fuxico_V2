import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WatermarkSettings {
  text: string;
  includeEmail: boolean;
  includeDate: boolean;
  opacity: number;
  fontSize: number;
  color: string;
  rotation: number;
  position: 'center' | 'diagonal' | 'footer' | 'header';
}

export interface WatermarkedDocument {
  id: string;
  original_document_id: string;
  recipient_email: string;
  watermark_settings: WatermarkSettings;
  watermarked_url: string;
  views_count: number;
  created_at: string;
}

const DEFAULT_WATERMARK: WatermarkSettings = {
  text: 'CONFIDENTIAL',
  includeEmail: true,
  includeDate: true,
  opacity: 0.3,
  fontSize: 48,
  color: '#888888',
  rotation: -45,
  position: 'diagonal'
};

export function usePDFWatermark() {
  const [isLoading, setIsLoading] = useState(false);
  const [watermarkedDocs, setWatermarkedDocs] = useState<WatermarkedDocument[]>([]);
  const { toast } = useToast();

  const loadWatermarkedDocs = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('watermarked_documents').select('*').order('created_at', { ascending: false });
    if (data) setWatermarkedDocs(data as WatermarkedDocument[]);
  }, []);

  const createWatermarkedDocument = useCallback(async (
    documentId: string,
    recipientEmail: string,
    settings: Partial<WatermarkSettings> = {}
  ): Promise<WatermarkedDocument> => {
    setIsLoading(true);
    try {
      const watermarkSettings: WatermarkSettings = { ...DEFAULT_WATERMARK, ...settings };
      
      const { data, error } = await supabase.functions.invoke('create-watermarked-pdf', {
        body: { documentId, recipientEmail, settings: watermarkSettings }
      });
      
      if (error) throw error;
      
      toast({ title: 'Watermarked PDF created', description: `Ready for ${recipientEmail}` });
      await loadWatermarkedDocs();
      return data as WatermarkedDocument;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadWatermarkedDocs, toast]);

  const generateWatermarkText = useCallback((settings: WatermarkSettings, email: string): string => {
    let text = settings.text;
    if (settings.includeEmail) text += `\n${email}`;
    if (settings.includeDate) text += `\n${new Date().toLocaleDateString()}`;
    return text;
  }, []);

  const previewWatermark = useCallback((settings: WatermarkSettings, email: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((settings.rotation * Math.PI) / 180);
    ctx.font = `${settings.fontSize / 2}px Arial`;
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = settings.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = generateWatermarkText(settings, email);
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, (i - lines.length / 2) * (settings.fontSize / 2 + 5));
    });
    
    ctx.restore();
    return canvas.toDataURL();
  }, [generateWatermarkText]);

  const getWatermarkLink = useCallback((docId: string): string => {
    return `${window.location.origin}/view/watermarked/${docId}`;
  }, []);

  const revokeAccess = useCallback(async (docId: string): Promise<void> => {
    await supabase.from('watermarked_documents').update({ revoked: true }).eq('id', docId);
    toast({ title: 'Access revoked' });
    await loadWatermarkedDocs();
  }, [loadWatermarkedDocs, toast]);

  return {
    isLoading, watermarkedDocs,
    loadWatermarkedDocs, createWatermarkedDocument, generateWatermarkText, previewWatermark, getWatermarkLink, revokeAccess,
    defaultSettings: DEFAULT_WATERMARK
  };
}
