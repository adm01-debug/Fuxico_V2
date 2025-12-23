import { useState } from 'react';
import { usePDFWatermark } from '@/hooks/use-pdf-watermark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplet, Eye, X } from 'lucide-react';

export function WatermarkTab() {
  const { watermarkedDocs, createWatermark, revokeAccess, previewWatermark } = usePDFWatermark();
  const [docId, setDocId] = useState('');
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState({ text: '', opacity: 0.3, rotation: -45 });

  const handleCreate = async () => {
    if (!docId || !email) return;
    await createWatermark(docId, email, settings);
    setDocId(''); setEmail('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Droplet />PDF com Watermark</h2>
      <Card>
        <CardHeader><CardTitle>Criar Watermark</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="ID do Documento" value={docId} onChange={e => setDocId(e.target.value)} />
          <Input placeholder="Email do destinatário" value={email} onChange={e => setEmail(e.target.value)} />
          <Input placeholder="Texto do watermark (opcional)" value={settings.text} onChange={e => setSettings({...settings, text: e.target.value})} />
          <div className="space-y-2">
            <label className="text-sm">Opacidade: {(settings.opacity * 100).toFixed(0)}%</label>
            <Slider value={[settings.opacity * 100]} onValueChange={v => setSettings({...settings, opacity: v[0] / 100})} max={100} step={5} />
          </div>
          <Button onClick={handleCreate}><Droplet className="w-4 h-4 mr-2" />Criar PDF com Watermark</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Documentos Protegidos</CardTitle></CardHeader>
        <CardContent>
          {watermarkedDocs.map(d => (
            <div key={d.id} className="flex justify-between items-center p-3 border rounded mb-2">
              <div><span>{d.recipient_email}</span><Badge variant="outline" className="ml-2"><Eye className="w-3 h-3 mr-1" />{d.views_count}</Badge></div>
              <div className="flex gap-2">
                {d.revoked ? <Badge variant="destructive">Revogado</Badge> : 
                  <Button size="sm" variant="destructive" onClick={() => revokeAccess(d.id)}><X className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
