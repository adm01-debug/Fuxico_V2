// ScreenRecordingTab.tsx
import { useState } from 'react';
import { useScreenRecording } from '@/hooks/use-screen-recording';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Square, Play, Share2, Eye } from 'lucide-react';

export function ScreenRecordingTab() {
  const { recordings, isRecording, startRecording, stopRecording, loadRecordings, getShareableLink } = useScreenRecording();
  const [options, setOptions] = useState({ screen: true, camera: false, audio: true });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Video />Gravação de Tela</h2>
      <Card>
        <CardHeader><CardTitle>Nova Gravação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {['screen', 'camera', 'audio'].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={options[opt as keyof typeof options]} 
                  onChange={e => setOptions({...options, [opt]: e.target.checked})} />
                <span className="capitalize">{opt}</span>
              </label>
            ))}
          </div>
          {!isRecording ? (
            <Button onClick={() => startRecording(options)}><Play className="w-4 h-4 mr-2" />Iniciar Gravação</Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}><Square className="w-4 h-4 mr-2" />Parar Gravação</Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Gravações</CardTitle></CardHeader>
        <CardContent>
          {recordings.map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 border rounded mb-2">
              <div><span className="font-medium">{r.title || 'Sem título'}</span><span className="text-sm text-muted-foreground ml-2">{Math.round(r.duration / 60)}min</span></div>
              <div className="flex items-center gap-2">
                <Badge><Eye className="w-3 h-3 mr-1" />{r.views_count}</Badge>
                <Button size="sm" variant="outline" onClick={() => getShareableLink(r.id)}><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
