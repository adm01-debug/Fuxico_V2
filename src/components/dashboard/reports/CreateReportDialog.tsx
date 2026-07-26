import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ReportType, ReportFormat } from '@/hooks/use-scheduled-reports';

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

export { metricOptions };

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    report_type: ReportType;
    format: ReportFormat;
    recipients: string[];
    metrics: string[];
  }) => Promise<unknown>;
  isPending: boolean;
}

export function CreateReportDialog({ open, onOpenChange, onCreate, isPending }: CreateReportDialogProps) {
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    format: 'email' as 'email' | 'pdf' | 'csv',
    recipients: [] as string[],
    metrics: ['emails_sent', 'opens', 'clicks'] as string[],
  });
  const [recipientInput, setRecipientInput] = useState('');

  const handleSubmit = async () => {
    if (!newReport.name) { toast.error('Informe o nome do relatório'); return; }
    if (newReport.recipients.length === 0) { toast.error('Adicione pelo menos um destinatário'); return; }
    await onCreate(newReport);
    setNewReport({ name: '', report_type: 'weekly', format: 'email', recipients: [], metrics: ['emails_sent', 'opens', 'clicks'] });
    onOpenChange(false);
  };

  const removeRecipient = (email: string) =>
    setNewReport(prev => ({ ...prev, recipients: prev.recipients.filter(e => e !== email) }));

  const addRecipient = () => {
    if (!recipientInput || !recipientInput.includes('@')) { toast.error('Email inválido'); return; }
    setNewReport(prev => ({ ...prev, recipients: [...prev.recipients, recipientInput] }));
    setRecipientInput('');
  };

  const toggleMetric = (metric: string) => {
    setNewReport(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric) ? prev.metrics.filter(m => m !== metric) : [...prev.metrics, metric],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Relatório</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Relatório Agendado</DialogTitle>
          <DialogDescription>Configure um novo relatório automático</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Relatório</Label>
            <Input placeholder="Ex: Resumo Semanal" value={newReport.name}
              onChange={e => setNewReport(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={newReport.report_type} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setNewReport(prev => ({ ...prev, report_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={newReport.format} onValueChange={(v: 'email' | 'pdf' | 'csv') => setNewReport(prev => ({ ...prev, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Checkbox id={option.value} checked={newReport.metrics.includes(option.value)} onCheckedChange={() => toggleMetric(option.value)} />
                  <label htmlFor={option.value} className="text-sm">{option.label}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Destinatários</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {newReport.recipients.map(email => (
                <Badge key={email} variant="secondary" className="cursor-pointer"
                  onClick={() => removeRecipient(email)}>{email} ×</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="email@exemplo.com" value={recipientInput} onChange={e => setRecipientInput(e.target.value)} />
              <Button type="button" variant="outline" onClick={addRecipient}>Adicionar</Button>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
