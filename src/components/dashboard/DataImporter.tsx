// =============================================================================
// FUXICO - Component: DataImporter
// Componente unificado para importação de CSV e Excel
// =============================================================================

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { importCSV, ImportResult, downloadCSVTemplate } from '@/lib/csv-importer';
import { importExcel } from '@/lib/excel-importer';

interface DataImporterProps<T> {
  schema: z.ZodSchema<T>;
  onImport: (data: T[]) => Promise<void>;
  entityName: string;
  templateFields?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function DataImporter<T>({
  schema,
  onImport,
  entityName,
  templateFields,
  open,
  onOpenChange,
}: DataImporterProps<T>) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setResult(null);
    setProgress(0);
    setError(null);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setProgress(10);

    try {
      const isExcel = selectedFile.name.match(/\.xlsx?$/i);
      
      setProgress(30);
      const importResult = isExcel
        ? await importExcel(selectedFile, schema)
        : await importCSV(selectedFile, schema);
      
      setProgress(70);
      setResult(importResult);
      setStep('preview');
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      setProgress(0);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;

    setStep('importing');
    setProgress(0);

    try {
      // Simular progresso
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      await onImport(result.success);
      
      clearInterval(interval);
      setProgress(100);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
      setStep('preview');
    }
  };

  const handleDownloadTemplate = () => {
    if (schema instanceof z.ZodObject) {
      downloadCSVTemplate(schema, `template_${entityName}.csv`);
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar {entityName}
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel para importar dados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="flex gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    Clique para selecionar ou arraste um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    CSV, XLSX ou XLS (máx. 10MB)
                  </p>
                </label>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {progress > 0 && progress < 100 && step !== 'complete' && (
            <Progress value={progress} className="h-2" />
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step: Preview */}
          {step === 'preview' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                  {result.success.length} válidos
                </Badge>
                {result.errors.length > 0 && (
                  <Badge variant="outline">
                    {result.errors.length} erros
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  de {result.total} registros
                </span>
              </div>

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erros encontrados</AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="h-32 mt-2">
                      <div className="space-y-1 text-xs">
                        {result.errors.slice(0, 20).map((err, i) => (
                          <div key={i}>
                            Linha {err.row}: {err.field} - {err.message}
                          </div>
                        ))}
                        {result.errors.length > 20 && (
                          <div className="text-muted-foreground">
                            +{result.errors.length - 20} erros...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {result.success.length > 0 && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Pronto para importar</AlertTitle>
                  <AlertDescription>
                    {result.success.length} registros serão importados
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Importando dados...</p>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Importação concluída!</AlertTitle>
              <AlertDescription>
                {result?.success.length} registros foram importados com sucesso
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Escolher outro arquivo
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={!result || result.success.length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {result?.success.length || 0} registros
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DataImporter;
