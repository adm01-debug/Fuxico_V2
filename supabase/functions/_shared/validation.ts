/**
 * Shared Validation Utilities
 * @description Zod schemas and validation helpers for Edge Functions
 */
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Base schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const dateSchema = z.string().datetime();

// Common request schemas
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const dateRangeSchema = z.object({
  start: dateSchema,
  end: dateSchema,
}).refine(data => new Date(data.start) <= new Date(data.end), {
  message: 'Start date must be before end date',
});

// Validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues.map(i => i.message).join(', ') };
  }
  return { success: true, data: result.data };
}

// Error response helper
export function validationErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: `Validation error: ${error}` }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

// Rate limiting schema
export const rateLimitSchema = z.object({
  key: z.string().min(1),
  limit: z.number().min(1).max(10000),
  window: z.number().min(1).max(86400),
});

// Security event schema
export const securityEventSchema = z.object({
  eventType: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  details: z.record(z.unknown()),
  userId: uuidSchema.optional(),
  ip: z.string().ip().optional(),
});
