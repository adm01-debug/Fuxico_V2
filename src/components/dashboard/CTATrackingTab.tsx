import { useState, useEffect } from 'react';
import { useCTATracking } from '@/hooks/use-cta-tracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MousePointer, Plus, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CTATrackingTab() {
  const { buttons, loadButtons, createButton, getButtonHTML, deleteButton } = useCTATracking();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => { loadButtons(); }, []);

  const handleCreate = async () => {
    if (!name || !text || !url) return;
    await createButton({ name, text, url });
    setName(''); setText(''); setUrl('');
  };

  const copyHTML = (btn: any) => {
    navigator.clipboard.writeText(getButtonHTML(btn));
    toast({ title: 'HTML copiado!' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><MousePointer />Rastreamento de CTAs</h2>
      <Card>
        <CardHeader><CardTitle>Novo Botão CTA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nome do botão" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Texto do botão" value={text} onChange={e => setText(e.target.value)} />
          <Input placeholder="URL de destino" value={url} onChange={e => setUrl(e.target.value)} />
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Criar Botão</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Botões Criados</CardTitle></CardHeader>
        <CardContent>
          {buttons.map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 border rounded mb-2">
              <div><span className="font-medium">{b.name}</span><span className="text-muted-foreground ml-2">"{b.text}"</span></div>
              <div className="flex items-center gap-2">
                <Badge>{b.clicks} cliques</Badge>
                <Button size="sm" variant="outline" onClick={() => copyHTML(b)}><Copy className="w-4 h-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => deleteButton(b.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
