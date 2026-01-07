// FUXICO - Component: ExportMenu
import { Download, FileText, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type ExportFormat = 'csv' | 'json';

interface ExportMenuProps<T> {
  data: T[];
  filename?: string;
  columns?: string[];
  columnLabels?: Record<string, string>;
  onExport?: (format: ExportFormat) => void;
  disabled?: boolean;
}

export function ExportMenu<T extends Record<string, unknown>>({
  data,
  filename = 'export',
  columns,
  columnLabels,
  onExport,
  disabled = false,
}: ExportMenuProps<T>) {
  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.warning('Nenhum dado para exportar');
      return;
    }

    try {
      onExport?.(format);
      
      const cols = columns || Object.keys(data[0]);
      
      switch (format) {
        case 'csv':
          exportCSV(data, cols, columnLabels, filename);
          break;
        case 'json':
          exportJSON(data, filename);
          break;
        default:
          toast.info('Formato em desenvolvimento');
      }
      
      toast.success(`Exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Erro ao exportar');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
          {data.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({data.length})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  cols: string[],
  labels?: Record<string, string>,
  filename?: string
) {
  const headers = cols.map(c => labels?.[c] || c);
  const rows = data.map(row => cols.map(c => String(row[c] ?? '')));
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

function exportJSON<T>(data: T[], filename?: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob(['\ufeff' + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default ExportMenu;
