// =============================================================================
// FUXICO - Lib: Excel Importer
// Utilitário para importação de arquivos Excel (XLSX/XLS)
// =============================================================================

import { z } from 'zod';
import { ImportResult, ImportError } from './csv-importer';

/**
 * Import Excel file with Zod validation
 * Usa a biblioteca xlsx que está disponível no ambiente
 */
export async function importExcel<T>(
  file: File,
  schema: z.ZodSchema<T>,
  sheetName?: string
): Promise<ImportResult<T>> {
  // Importar XLSX dinamicamente
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Selecionar sheet
        const targetSheet = sheetName || workbook.SheetNames[0];
        const sheet = workbook.Sheets[targetSheet];
        
        if (!sheet) {
          throw new Error(`Sheet "${targetSheet}" não encontrada`);
        }
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          defval: '',
        });
        
        const success: T[] = [];
        const errors: ImportError[] = [];
        let skipped = 0;
        
        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // +2 porque linha 1 é header
          
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
            }
            skipped++;
          }
        });
        
        resolve({
          success,
          errors,
          total: jsonData.length,
          skipped,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get sheet names from Excel file
 */
export async function getExcelSheets(file: File): Promise<string[]> {
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export data to Excel
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Dados'
): Promise<void> {
  const XLSX = await import('xlsx');
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidths: number[] = [];
  data.forEach((row) => {
    Object.values(row).forEach((value, index) => {
      const len = String(value).length;
      maxWidths[index] = Math.max(maxWidths[index] || 0, len);
    });
  });
  
  worksheet['!cols'] = maxWidths.map((w) => ({ wch: Math.min(w + 2, 50) }));
  
  XLSX.writeFile(workbook, filename);
}

export default importExcel;
