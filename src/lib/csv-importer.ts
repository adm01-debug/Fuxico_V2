// =============================================================================
// FUXICO - Lib: CSV Importer
// Utilitário para importação de arquivos CSV com validação Zod
// =============================================================================

import { z } from 'zod';

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  total: number;
  skipped: number;
}

export interface ImportError {
  row: number;
  field: string;
  value: unknown;
  message: string;
}

export interface ImportOptions {
  skipFirstRow?: boolean;
  delimiter?: string;
  trimValues?: boolean;
  skipEmptyRows?: boolean;
}

const DEFAULT_OPTIONS: ImportOptions = {
  skipFirstRow: false,
  delimiter: ',',
  trimValues: true,
  skipEmptyRows: true,
};

/**
 * Parse CSV content to array of objects
 */
function parseCSV(content: string, options: ImportOptions): Record<string, string>[] {
  const lines = content.split(/\r?\n/);
  const delimiter = options.delimiter || ',';
  
  if (lines.length === 0) return [];
  
  // Parse header
  const header = parseCSVLine(lines[0], delimiter);
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (options.skipEmptyRows && (!line || line.trim() === '')) {
      continue;
    }
    
    const values = parseCSVLine(line, delimiter);
    const row: Record<string, string> = {};
    
    header.forEach((key, index) => {
      let value = values[index] || '';
      if (options.trimValues) {
        value = value.trim();
      }
      row[key.trim()] = value;
    });
    
    results.push(row);
  }
  
  return results;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Import CSV file with Zod validation
 */
export async function importCSV<T>(
  file: File,
  schema: z.ZodSchema<T>,
  options: ImportOptions = {}
): Promise<ImportResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const rows = parseCSV(content, opts);
        
        const success: T[] = [];
        const errors: ImportError[] = [];
        let skipped = 0;
        
        rows.forEach((row, index) => {
          const rowNumber = index + 2; // +2 porque linha 1 é header e índice começa em 0
          
          try {
            const validated = schema.parse(row);
            success.push(validated);
          } catch (error) {
            if (error instanceof z.ZodError) {
              error.errors.forEach((err) => {
                errors.push({
                  row: rowNumber,
                  field: err.path.join('.'),
                  value: row[err.path[0] as string],
                  message: err.message,
                });
              });
            } else {
              errors.push({
                row: rowNumber,
                field: 'unknown',
                value: null,
                message: String(error),
              });
            }
            skipped++;
          }
        });
        
        resolve({
          success,
          errors,
          total: rows.length,
          skipped,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Generate CSV template from Zod schema
 */
export function generateCSVTemplate(schema: z.ZodObject<any>): string {
  const shape = schema.shape;
  const headers = Object.keys(shape);
  return headers.join(',');
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(
  schema: z.ZodObject<any>,
  filename: string = 'template.csv'
): void {
  const content = generateCSVTemplate(schema);
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default importCSV;
