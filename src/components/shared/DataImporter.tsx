// =============================================================================
// FUXICO - Component: DataImporter
// Importador de dados CSV/Excel com preview e validação
// =============================================================================

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { importCSV, ImportResult, downloadCSVTemplate } from '@/lib/csv-importer';
import { importExcel } from '@/lib/excel-importer';

interface DataImporterProps<T> {
  schema: z.ZodSchema<T>;
  onImport: (data: T[]) => Promise<void>;
  templateFields?: { name: string; example: string }[];
  templateFilename?: string;
  entityName?: string;
  maxRows?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataImporter<T>({
  schema,
  onImport,
  templateFields,
  templateFilename = 'template',
  entityName = 'registros',
  maxRows = 1000,
  open,
  onOpenChange,
}: DataImporterProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setError(null);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    reset();
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(10);

    try {
      const isExcel = selectedFile.name.match(/\.xlsx?$/i);
      setProgress(30);

      const importResult = isExcel
        ? await importExcel(selectedFile, schema)
        : await importCSV(selectedFile, schema);

      setProgress(80);

      if (importResult.success.length > maxRows) {
        setError(`Máximo de ${maxRows} registros por vez. Arquivo tem ${importResult.success.length}.`);
        setResult(null);
      } else {
        setResult(importResult);
      }

      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    try {
      await onImport(result.success);
      setProgress(100);
      
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar dados');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (templateFields) {
      downloadCSVTemplate(templateFields, `${templateFilename}.csv`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar {entityName}</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou Excel para importar dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <label className="flex-1">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing || isImporting}
                className="cursor-pointer"
              />
            </label>

            {templateFields && (
              <Button variant="outline" size="icon" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(isProcessing || isImporting) && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {isProcessing ? 'Processando arquivo...' : 'Importando dados...'}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !error && (
            <>
              <Alert variant={result.errors.length > 0 ? 'default' : 'default'}>
                {result.errors.length === 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      <strong>{result.success.length}</strong> {entityName} válidos para importar
                      {result.skipped > 0 && ` (${result.skipped} linhas vazias ignoradas)`}
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      <strong>{result.success.length}</strong> válidos, 
                      <strong className="text-destructive"> {result.errors.length}</strong> com erros
                    </AlertDescription>
                  </>
                )}
              </Alert>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-destructive flex items-start gap-2">
                      <X className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>
                        Linha {err.row}: campo <code>{err.field}</code> - {err.message}
                      </span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <div className="text-muted-foreground mt-2">
                      + {result.errors.length - 10} erros adicionais...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={!result || result.success.length === 0 || isImporting}
          >
            {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {result?.success.length || 0} {entityName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
