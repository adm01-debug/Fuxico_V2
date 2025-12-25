import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Export types supported by the worker
 */
type ExportType = 'csv' | 'json' | 'pdf';

/**
 * Hook return type
 */
interface UseExportWorkerReturn {
  /** Export data using web worker */
  exportData: (type: ExportType, data: unknown[], columns?: string[]) => Promise<void>;
  /** Whether export is in progress */
  isExporting: boolean;
  /** Export progress percentage (0-100) */
  progress: number;
  /** Error message if export failed */
  error: string | null;
  /** Cancel ongoing export */
  cancel: () => void;
}

/**
 * Hook for exporting data using Web Worker
 * 
 * @description Handles heavy export operations in a separate thread
 * to keep the UI responsive during large data exports.
 * 
 * @example
 * ```tsx
 * const { exportData, isExporting, progress, error } = useExportWorker();
 * 
 * const handleExport = async () => {
 *   await exportData('csv', emails, ['recipient', 'subject', 'opens']);
 * };
 * 
 * return (
 *   <Button onClick={handleExport} disabled={isExporting}>
 *     {isExporting ? `Exporting... ${progress}%` : 'Export CSV'}
 *   </Button>
 * );
 * ```
 * 
 * @returns Export functions and state
 */
export function useExportWorker(): UseExportWorkerReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const exportData = useCallback(async (
    type: ExportType,
    data: unknown[],
    columns?: string[]
  ): Promise<void> => {
    setIsExporting(true);
    setProgress(0);
    setError(null);

    return new Promise((resolve, reject) => {
      try {
        // Create worker
        workerRef.current = new Worker(
          new URL('../workers/export.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = (event) => {
          const { type: resultType, blob, filename, error: workerError } = event.data;

          if (resultType === 'success' && blob) {
            // Download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `export.${type}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100);
            setIsExporting(false);
            resolve();
          } else if (resultType === 'error') {
            setError(workerError || 'Export failed');
            setIsExporting(false);
            reject(new Error(workerError));
          }
        };

        workerRef.current.onerror = (err) => {
          setError(err.message);
          setIsExporting(false);
          reject(err);
        };

        // Start export
        workerRef.current.postMessage({ type, data, columns });
        setProgress(50);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export failed';
        setError(message);
        setIsExporting(false);
        reject(err);
      }
    });
  }, []);

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsExporting(false);
    setProgress(0);
  }, []);

  return {
    exportData,
    isExporting,
    progress,
    error,
    cancel
  };
}
