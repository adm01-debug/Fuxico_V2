import { useState } from 'react';
import { useMassEmail } from '@/hooks/use-mass-email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Calendar, Users, BarChart } from 'lucide-react';

export function MassEmailTab() {
  const { campaigns, monthlyUsage, isLoading, createCampaign, pauseCampaign, resumeCampaign } = useMassEmail();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');

  const handleSend = async () => {
    const emails = recipients.split('\n').map(e => e.trim()).filter(Boolean);
    await createCampaign(emails, subject, body);
    setSubject(''); setBody(''); setRecipients('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campanhas em Massa</h2>
        <Badge variant="outline"><Users className="w-4 h-4 mr-1" />{monthlyUsage}/60.000 este mês</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>Nova Campanha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Assunto" value={subject} onChange={e => setSubject(e.target.value)} />
          <Textarea placeholder="Corpo do email" value={body} onChange={e => setBody(e.target.value)} rows={6} />
          <Textarea placeholder="Emails (um por linha)" value={recipients} onChange={e => setRecipients(e.target.value)} rows={4} />
          <Button onClick={handleSend} disabled={isLoading}><Send className="w-4 h-4 mr-2" />Enviar Campanha</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Campanhas Anteriores</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {campaigns.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 border rounded">
                <div><span className="font-medium">{c.name}</span><span className="text-sm text-muted-foreground ml-2">{c.total_recipients} destinatários</span></div>
                <div className="flex items-center gap-2">
                  <Badge>{c.status}</Badge>
                  <span className="text-sm">{c.open_rate.toFixed(1)}% abertos</span>
                  {c.status === 'sending' && <Button size="sm" variant="outline" onClick={() => pauseCampaign(c.id)}>Pausar</Button>}
                  {c.status === 'paused' && <Button size="sm" onClick={() => resumeCampaign(c.id)}>Retomar</Button>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
