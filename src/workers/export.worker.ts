/**
 * Web Worker for heavy export operations
 * 
 * @description Handles CSV, JSON, and PDF export in a separate thread
 * to avoid blocking the main thread during large data exports.
 */

interface ExportMessage {
  type: 'csv' | 'json' | 'pdf';
  data: unknown[];
  columns?: string[];
  filename?: string;
}

interface ExportResult {
  type: 'success' | 'error';
  blob?: Blob;
  filename?: string;
  error?: string;
}

self.onmessage = async (event: MessageEvent<ExportMessage>) => {
  const { type, data, columns, filename } = event.data;

  try {
    let result: Blob;
    let outputFilename: string;

    switch (type) {
      case 'csv':
        result = exportToCSV(data, columns);
        outputFilename = filename || `export-${Date.now()}.csv`;
        break;
      
      case 'json':
        result = exportToJSON(data);
        outputFilename = filename || `export-${Date.now()}.json`;
        break;
      
      case 'pdf':
        result = await exportToPDF(data, columns);
        outputFilename = filename || `export-${Date.now()}.pdf`;
        break;
      
      default:
        throw new Error(`Unknown export type: ${type}`);
    }

    self.postMessage({
      type: 'success',
      blob: result,
      filename: outputFilename
    } as ExportResult);
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Export failed'
    } as ExportResult);
  }
};

function exportToCSV(data: unknown[], columns?: string[]): Blob {
  if (data.length === 0) {
    return new Blob([''], { type: 'text/csv' });
  }

  const headers = columns || Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map(item => {
    const record = item as Record<string, unknown>;
    return headers.map(col => {
      const value = record[col];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

function exportToJSON(data: unknown[]): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: 'application/json' });
}

async function exportToPDF(data: unknown[], columns?: string[]): Promise<Blob> {
  // Simplified PDF generation (would use pdf-lib in real implementation)
  const content = JSON.stringify(data, null, 2);
  return new Blob([content], { type: 'application/pdf' });
}

export {};
