import { log } from '@/lib/logger';
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileSpreadsheet, FileText, Loader2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ExportDialogProps {
  onExport?: (options: ExportOptions) => Promise<void>;
  data?: Record<string, unknown>[];
  children?: React.ReactNode;
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  dateFrom: string;
  dateTo: string;
  includeStats: boolean;
  includeEvents: boolean;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).includes(',') ? `"${value}"` : String(value);
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

export function ExportDialog({ onExport, data = [], children }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    dateFrom: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    includeStats: true,
    includeEvents: false,
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (onExport) {
        await onExport(options);
      } else if (data.length > 0) {
        const filename = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}`;
        
        switch (options.format) {
          case 'csv':
            downloadFile(convertToCSV(data), `${filename}.csv`, 'text/csv');
            break;
          case 'json':
            downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json');
            break;
          case 'xlsx':
            // For xlsx, we'd need a library like xlsx, so fallback to CSV
            downloadFile(convertToCSV(data), `${filename}.csv`, 'text/csv');
            toast.info('Formato XLSX não disponível, exportando como CSV');
            break;
        }
      }
      
      toast.success('Exportação concluída com sucesso!');
      setOpen(false);
    } catch (error) {
      log.error('Export error:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Formato do Arquivo</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as ExportOptions['format'] }))}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-1 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center gap-1 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-1 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  JSON
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">De</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={options.dateFrom}
                  onChange={(e) => setOptions(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">Até</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={options.dateTo}
                  onChange={(e) => setOptions(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Opções</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStats"
                  checked={options.includeStats}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeStats: checked === true }))
                  }
                />
                <Label htmlFor="includeStats" className="cursor-pointer">
                  Incluir estatísticas (aberturas, cliques)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEvents"
                  checked={options.includeEvents}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeEvents: checked === true }))
                  }
                />
                <Label htmlFor="includeEvents" className="cursor-pointer">
                  Incluir histórico de eventos
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
