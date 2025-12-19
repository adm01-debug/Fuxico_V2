import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, FileText, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  format: 'email' | 'pdf' | 'csv';
  enabled: boolean;
  recipients: string[];
  lastSent?: string;
  nextSend?: string;
  metrics: string[];
}

const defaultReports: ScheduledReport[] = [
  {
    id: '1',
    name: 'Resumo Diário',
    type: 'daily',
    format: 'email',
    enabled: true,
    recipients: ['equipe@promobrindes.com.br'],
    lastSent: new Date(Date.now() - 86400000).toISOString(),
    nextSend: new Date(Date.now() + 43200000).toISOString(),
    metrics: ['emails_sent', 'opens', 'clicks', 'bounce_rate'],
  },
  {
    id: '2',
    name: 'Relatório Semanal',
    type: 'weekly',
    format: 'pdf',
    enabled: true,
    recipients: ['gerencia@promobrindes.com.br'],
    lastSent: new Date(Date.now() - 604800000).toISOString(),
    nextSend: new Date(Date.now() + 259200000).toISOString(),
    metrics: ['emails_sent', 'opens', 'clicks', 'conversions', 'top_recipients'],
  },
];

const metricOptions = [
  { value: 'emails_sent', label: 'Emails Enviados' },
  { value: 'opens', label: 'Aberturas' },
  { value: 'clicks', label: 'Cliques' },
  { value: 'bounce_rate', label: 'Taxa de Bounce' },
  { value: 'conversions', label: 'Conversões' },
  { value: 'top_recipients', label: 'Top Destinatários' },
  { value: 'open_times', label: 'Horários de Abertura' },
  { value: 'geo_distribution', label: 'Distribuição Geográfica' },
];

export function ReportsTab() {
  const [reports, setReports] = useState<ScheduledReport[]>(defaultReports);
  const [newRecipient, setNewRecipient] = useState('');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleReport = (id: string) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
    toast.success('Configuração atualizada');
  };

  const addRecipient = (reportId: string) => {
    if (!newRecipient || !newRecipient.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    
    setReports(reports.map(r => 
      r.id === reportId 
        ? { ...r, recipients: [...r.recipients, newRecipient] }
        : r
    ));
    setNewRecipient('');
    toast.success('Destinatário adicionado');
  };

  const removeRecipient = (reportId: string, email: string) => {
    setReports(reports.map(r => 
      r.id === reportId 
        ? { ...r, recipients: r.recipients.filter(e => e !== email) }
        : r
    ));
  };

  const downloadReport = (report: ScheduledReport) => {
    toast.info('Gerando relatório...', {
      description: 'O download iniciará em instantes',
    });
    
    // Simular download
    setTimeout(() => {
      toast.success('Relatório gerado!', {
        description: `${report.name}.${report.format === 'email' ? 'html' : report.format}`,
      });
    }, 2000);
  };

  const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    daily: { label: 'Diário', icon: <Clock className="h-4 w-4" /> },
    weekly: { label: 'Semanal', icon: <Calendar className="h-4 w-4" /> },
    monthly: { label: 'Mensal', icon: <Calendar className="h-4 w-4" /> },
  };

  const formatLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    email: { label: 'Email', icon: <Mail className="h-4 w-4" /> },
    pdf: { label: 'PDF', icon: <FileText className="h-4 w-4" /> },
    csv: { label: 'CSV', icon: <TrendingUp className="h-4 w-4" /> },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Agendados</CardTitle>
          <CardDescription>
            Configure relatórios automáticos para receber por email ou download
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reports.map(report => (
            <Card key={report.id} className={`${report.enabled ? 'border-primary/30' : 'opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      {typeLabels[report.type].icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{typeLabels[report.type].label}</Badge>
                        <Badge variant="secondary">{formatLabels[report.format].label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                      <Download className="h-4 w-4 mr-1" />
                      Gerar Agora
                    </Button>
                    <Switch 
                      checked={report.enabled}
                      onCheckedChange={() => toggleReport(report.id)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Último envio:</span>
                    <p className="font-medium">{formatDate(report.lastSent)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Próximo envio:</span>
                    <p className="font-medium">{formatDate(report.nextSend)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Métricas incluídas:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.metrics.map(m => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {metricOptions.find(o => o.value === m)?.label || m}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Destinatários:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.recipients.map(email => (
                        <Badge 
                          key={email} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-destructive/10"
                          onClick={() => removeRecipient(report.id, email)}
                        >
                          {email} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Adicionar email..."
                        value={newRecipient}
                        onChange={e => setNewRecipient(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addRecipient(report.id)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Card de estatísticas rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">156</p>
              <p className="text-xs text-muted-foreground">Relatórios enviados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">98%</p>
              <p className="text-xs text-muted-foreground">Taxa de entrega</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-muted-foreground">Destinatários ativos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">Agendamentos ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
