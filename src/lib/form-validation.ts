import { z } from 'zod';

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(/[A-Z]/, 'Deve conter maiúscula').regex(/[0-9]/, 'Deve conter número'),
  phone: z.string().regex(/^\+?[1-9]\d{10,14}$/, 'Telefone inválido'),
  url: z.string().url('URL inválida'),
  uuid: z.string().uuid('UUID inválido'),
  date: z.coerce.date(),
  positiveNumber: z.number().positive('Deve ser positivo'),
};

/**
 * Create form error messages from Zod errors
 */
export function getFormErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!errors[path]) errors[path] = err.message;
  });
  return errors;
}

/**
 * Validate form data with schema
 */
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: getFormErrors(result.error) };
}
