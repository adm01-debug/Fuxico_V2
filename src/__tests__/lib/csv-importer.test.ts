import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mock do módulo
const mockImportCSV = async <T>(
  file: File,
  schema: z.ZodSchema<T>
): Promise<{ success: T[]; errors: any[]; total: number; skipped: number }> => {
  return { success: [], errors: [], total: 0, skipped: 0 };
};

describe('CSV Importer', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    value: z.coerce.number().positive(),
  });

  it('validates data with Zod schema', async () => {
    const validData = { name: 'Test', email: 'test@test.com', value: 100 };
    const result = testSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const invalidData = { name: 'Test', email: 'invalid', value: 100 };
    const result = testSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects negative value', () => {
    const invalidData = { name: 'Test', email: 'test@test.com', value: -10 };
    const result = testSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('coerces string to number', () => {
    const data = { name: 'Test', email: 'test@test.com', value: '100' };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(100);
    }
  });

  it('rejects empty name', () => {
    const data = { name: '', email: 'test@test.com', value: 100 };
    const result = testSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
