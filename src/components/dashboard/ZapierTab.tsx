import { useState, useEffect } from 'react';
import { useZapier } from '@/hooks/use-zapier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Trash2, TestTube, ExternalLink } from 'lucide-react';

export function ZapierTab() {
  const { webhooks, logs, isLoading, loadWebhooks, registerWebhook, unregisterWebhook, testWebhook } = useZapier();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const events = ['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked'];
  useEffect(() => { loadWebhooks(); }, []);

  const handleRegister = async () => {
    if (!webhookUrl || !selectedEvents.length) return;
    await registerWebhook(webhookUrl, selectedEvents);
    setWebhookUrl(''); setSelectedEvents([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="text-orange-500" />Integração Zapier</h2>
        <a href="https://zapier.com" target="_blank" rel="noopener" className="text-sm text-muted-foreground flex items-center gap-1">
          Conecte 4000+ apps <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <Card>
        <CardHeader><CardTitle>Novo Webhook</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="URL do Webhook Zapier" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {events.map(ev => (
              <Badge key={ev} variant={selectedEvents.includes(ev) ? 'default' : 'outline'} className="cursor-pointer"
                onClick={() => setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])}>{ev}</Badge>
            ))}
          </div>
          <Button onClick={handleRegister} disabled={isLoading}><Zap className="w-4 h-4 mr-2" />Registrar Webhook</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Webhooks Ativos</CardTitle></CardHeader>
        <CardContent>
          {webhooks.map(w => (
            <div key={w.id} className="flex justify-between items-center p-3 border rounded mb-2">
              <div><code className="text-sm">{w.webhook_url}</code><div className="flex gap-1 mt-1">{w.events.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}</div></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => testWebhook(w.id)}><TestTube className="w-4 h-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => unregisterWebhook(w.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
