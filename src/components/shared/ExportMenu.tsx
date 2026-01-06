// =============================================================================
// FUXICO - Component: ExportMenu
// Menu de exportação para CSV, Excel, JSON e PDF
// =============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Printer,
  Loader2,
} from 'lucide-react';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToPDF,
  ExportColumn,
} from '@/lib/export-utils';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

interface ExportMenuProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
  disabled?: boolean;
  includeTimestamp?: boolean;
  onExportStart?: (format: ExportFormat) => void;
  onExportComplete?: (format: ExportFormat) => void;
}

export function ExportMenu<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  title,
  disabled = false,
  includeTimestamp = true,
  onExportStart,
  onExportComplete,
}: ExportMenuProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportFormat(format);
    onExportStart?.(format);

    try {
      const options = {
        filename,
        columns,
        title,
        includeTimestamp,
      };

      await new Promise(resolve => setTimeout(resolve, 300));

      switch (format) {
        case 'csv':
          exportToCSV(data, options);
          break;
        case 'excel':
          exportToExcel(data, options);
          break;
        case 'json':
          exportToJSON(data, options);
          break;
        case 'pdf':
          exportToPDF(data, options);
          break;
      }

      onExportComplete?.(format);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const isEmpty = data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isEmpty}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
          {data.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({data.length})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
          {exportFormat === 'csv' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
          {exportFormat === 'excel' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          <FileJson className="h-4 w-4 mr-2" />
          Exportar JSON
          {exportFormat === 'json' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir / PDF
          {exportFormat === 'pdf' && (
            <Loader2 className="h-3 w-3 ml-auto animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
