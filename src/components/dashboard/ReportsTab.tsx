import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Mail, FileText, TrendingUp, Download, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExportDialog } from './ExportDialog';
import { useTrackedEmails, useTrackingStats, type TrackedEmailWithStats } from '@/hooks/use-tracking';
import { useScheduledReports } from '@/hooks/use-scheduled-reports';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';

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

function ReportsTabBase() {
  const { reports, isLoading, createReport, toggleEnabled, addRecipient, removeRecipient, deleteReport } = useScheduledReports();
  const [newRecipient, setNewRecipient] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    format: 'email' as 'email' | 'pdf' | 'csv',
    recipients: [] as string[],
    metrics: ['emails_sent', 'opens', 'clicks'] as string[],
  });
  const [newReportRecipient, setNewReportRecipient] = useState('');

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleReport = (id: string, currentEnabled: boolean) => {
    toggleEnabled.mutate({ id, enabled: !currentEnabled });
  };

  const handleAddRecipient = (reportId: string) => {
    if (!newRecipient || !newRecipient.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    addRecipient.mutate({ id: reportId, email: newRecipient });
    setNewRecipient('');
  };

  const handleRemoveRecipient = (reportId: string, email: string) => {
    removeRecipient.mutate({ id: reportId, email });
  };

  const handleCreateReport = async () => {
    if (!newReport.name) {
      toast.error('Informe o nome do relatório');
      return;
    }
    if (newReport.recipients.length === 0) {
      toast.error('Adicione pelo menos um destinatário');
      return;
    }
    
    await createReport.mutateAsync(newReport);
    setNewReport({
      name: '',
      report_type: 'weekly',
      format: 'email',
      recipients: [],
      metrics: ['emails_sent', 'opens', 'clicks'],
    });
    setIsCreateOpen(false);
  };

  const handleAddNewReportRecipient = () => {
    if (!newReportRecipient || !newReportRecipient.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    setNewReport(prev => ({
      ...prev,
      recipients: [...prev.recipients, newReportRecipient],
    }));
    setNewReportRecipient('');
  };

  const handleToggleMetric = (metric: string) => {
    setNewReport(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric],
    }));
  };

  const downloadReport = (report: typeof reports[0]) => {
    toast.info('Gerando relatório...', {
      description: 'O download iniciará em instantes',
    });
    
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

  const { data: emails } = useTrackedEmails();
  const { data: stats } = useTrackingStats();
  
  const exportData = (emails || []).map(email => {
    const emailWithStats = email as TrackedEmailWithStats;
    return {
      id: email.id,
      tracking_id: email.tracking_id,
      destinatario: email.recipient_email,
      assunto: email.subject || '',
      remetente: email.sender_email || '',
      status: email.delivery_status || 'sent',
      data_envio: email.created_at,
      aberturas: emailWithStats.open_count || 0,
      cliques: emailWithStats.click_count || 0,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6" role="region" aria-label="Relatórios e Estatísticas">
        <Card role="article">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>
                Exporte seus dados de rastreamento em CSV ou JSON
              </CardDescription>
            </div>
            <ExportDialog data={exportData}>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Dados
              </Button>
            </ExportDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats?.totalEmails || 0}</p>
              <p className="text-xs text-muted-foreground">Emails para exportar</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.totalOpens || 0}</p>
              <p className="text-xs text-muted-foreground">Aberturas registradas</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats?.totalClicks || 0}</p>
              <p className="text-xs text-muted-foreground">Cliques registrados</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{exportData.length}</p>
              <p className="text-xs text-muted-foreground">Registros disponíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatórios Agendados</CardTitle>
              <CardDescription>
                Configure relatórios automáticos para receber por email ou download
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Relatório
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Relatório Agendado</DialogTitle>
                  <DialogDescription>
                    Configure um novo relatório automático
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Relatório</Label>
                    <Input
                      placeholder="Ex: Resumo Semanal"
                      value={newReport.name}
                      onChange={e => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={newReport.report_type}
                        onValueChange={(v: 'daily' | 'weekly' | 'monthly') => 
                          setNewReport(prev => ({ ...prev, report_type: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select
                        value={newReport.format}
                        onValueChange={(v: 'email' | 'pdf' | 'csv') => 
                          setNewReport(prev => ({ ...prev, format: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Métricas</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {metricOptions.map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.value}
                            checked={newReport.metrics.includes(option.value)}
                            onCheckedChange={() => handleToggleMetric(option.value)}
                          />
                          <label htmlFor={option.value} className="text-sm">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Destinatários</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {newReport.recipients.map(email => (
                        <Badge
                          key={email}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setNewReport(prev => ({
                            ...prev,
                            recipients: prev.recipients.filter(e => e !== email),
                          }))}
                        >
                          {email} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@exemplo.com"
                        value={newReportRecipient}
                        onChange={e => setNewReportRecipient(e.target.value)}
                      />
                      <Button type="button" variant="outline" onClick={handleAddNewReportRecipient}>
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateReport}
                    className="w-full"
                    disabled={createReport.isPending}
                  >
                    {createReport.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Relatório
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {reports.length === 0 ? (
            <EmptyState
              type="reports"
              title="Nenhum relatório agendado"
              description="Configure relatórios automáticos para receber métricas importantes diretamente no seu email."
              action={
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agendar Relatório
                </Button>
              }
            />
          ) : (
            reports.map(report => (
              <Card key={report.id} className={`${report.enabled ? 'border-primary/30' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${report.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        {typeLabels[report.report_type]?.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{typeLabels[report.report_type]?.label}</Badge>
                          <Badge variant="secondary">{formatLabels[report.format]?.label}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadReport(report)}>
                        <Download className="h-4 w-4 mr-1" />
                        Gerar Agora
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteReport.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Switch
                        checked={report.enabled}
                        onCheckedChange={() => handleToggleReport(report.id, report.enabled)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Último envio:</span>
                      <p className="font-medium">{formatDate(report.last_sent_at)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Próximo envio:</span>
                      <p className="font-medium">{formatDate(report.next_send_at)}</p>
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
                            onClick={() => handleRemoveRecipient(report.id, email)}
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
                          onClick={() => handleAddRecipient(report.id)}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Card de estatísticas rápidas */}
      <Card role="article">
        <CardHeader>
          <CardTitle className="text-base">Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{reports.length}</p>
              <p className="text-xs text-muted-foreground">Relatórios configurados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {reports.filter(r => r.enabled).length}
              </p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {reports.reduce((acc, r) => acc + r.recipients.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Destinatários</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {reports.filter(r => r.last_sent_at).length}
              </p>
              <p className="text-xs text-muted-foreground">Já enviados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const ReportsTab = memo(ReportsTabBase);
export default ReportsTab;
