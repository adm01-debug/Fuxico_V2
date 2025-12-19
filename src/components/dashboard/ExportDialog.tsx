import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrackedEmail } from '@/lib/tracking-api';
import { exportToCSV, exportToPDF, exportToJSON } from '@/lib/export-utils';
import { cn } from '@/lib/utils';

interface ExportDialogProps {
  emails: TrackedEmail[];
  trigger?: React.ReactNode;
}

type ExportFormat = 'csv' | 'pdf' | 'json';
type DatePreset = 'all' | '7days' | '30days' | 'custom';

export function ExportDialog({ emails, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [includeSelfOpens, setIncludeSelfOpens] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter emails by date
  const getFilteredEmails = (): TrackedEmail[] => {
    if (datePreset === 'all') return emails;
    
    const now = new Date();
    let startDate: Date;
    
    switch (datePreset) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case 'custom':
        if (!dateRange.from) return emails;
        startDate = dateRange.from;
        break;
      default:
        return emails;
    }
    
    const endDate = datePreset === 'custom' && dateRange.to ? dateRange.to : now;
    
    return emails.filter(email => {
      const emailDate = new Date(email.created_at);
      return emailDate >= startDate && emailDate <= endDate;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredEmails = getFilteredEmails();
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (format) {
        case 'csv':
          exportToCSV(filteredEmails, { includeSelfOpens });
          break;
        case 'pdf':
          exportToPDF(filteredEmails, { includeSelfOpens });
          break;
        case 'json':
          exportToJSON(filteredEmails);
          break;
      }
      
      setOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = getFilteredEmails().length;

  const formatOptions = [
    {
      value: 'csv',
      label: 'CSV (Excel)',
      description: 'Planilha compatível com Excel e Google Sheets',
      icon: FileSpreadsheet,
    },
    {
      value: 'pdf',
      label: 'PDF (Relatório)',
      description: 'Relatório formatado para impressão',
      icon: FileText,
    },
    {
      value: 'json',
      label: 'JSON (Backup)',
      description: 'Dados brutos para backup ou integração',
      icon: FileJson,
    },
  ];

  const dateOptions = [
    { value: 'all', label: 'Todo o período' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: 'custom', label: 'Período personalizado' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Exporte os dados de rastreamento para análise ou backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="grid gap-3">
                {formatOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors",
                      format === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <option.icon className={cn(
                      "h-5 w-5",
                      format === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    {format === option.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período</Label>
            <RadioGroup value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <div className="grid grid-cols-2 gap-2">
                {dateOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`date-${option.value}`}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors text-sm",
                      datePreset === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={`date-${option.value}`} />
                    <span>{option.label}</span>
                  </Label>
                ))}
              </div>
            </RadioGroup>

            {datePreset === 'custom' && (
              <div className="flex gap-2 mt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {dateRange.from 
                        ? format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                        : 'Data inicial'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {dateRange.to 
                        ? format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })
                        : 'Data final'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Opções</Label>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Incluir Self-Opens</p>
                <p className="text-xs text-muted-foreground">
                  Mostrar aberturas feitas por você mesmo
                </p>
              </div>
              <Switch
                checked={includeSelfOpens}
                onCheckedChange={setIncludeSelfOpens}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Emails a exportar:</span>
              <span className="font-semibold">{filteredCount} de {emails.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || filteredCount === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
