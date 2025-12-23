// =============================================================================
// FUXICO - Schemas de Validação com Zod
// Arquivo: supabase/functions/_shared/schemas.ts
// Descrição: Validação de input para todas as Edge Functions
// =============================================================================

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// =============================================================================
// TIPOS BASE REUTILIZÁVEIS
// =============================================================================

export const emailSchema = z.string().email('Email inválido');
export const uuidSchema = z.string().uuid('UUID inválido');
export const urlSchema = z.string().url('URL inválida');
export const isoDateSchema = z.string().datetime('Data/hora inválida');
export const stringSchema = (max = 500) => 
  z.string().min(1, 'Campo obrigatório').max(max, `Máximo ${max} caracteres`);
export const positiveNumberSchema = z.number().positive('Deve ser positivo');

// =============================================================================
// SCHEMAS PARA CREATE-TRACKING
// =============================================================================

export const createTrackingSchema = z.object({
  recipientEmail: emailSchema,
  subject: stringSchema(500).optional().default('(Sem assunto)'),
  senderEmail: emailSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateTrackingInput = z.infer<typeof createTrackingSchema>;

// =============================================================================
// SCHEMAS PARA AI-INSIGHTS
// =============================================================================

export const aiInsightsSchema = z.object({
  trackingIds: z.array(z.string()).optional(),
  timeRange: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  type: z.enum(['engagement', 'deliverability', 'patterns']).optional().default('engagement'),
});

export type AiInsightsInput = z.infer<typeof aiInsightsSchema>;

// =============================================================================
// SCHEMAS PARA TRACK-PIXEL / TRACK-LINK
// =============================================================================

export const trackEventSchema = z.object({
  trackingId: z.string().min(1, 'tracking_id obrigatório'),
  eventType: z.enum(['open', 'click']).optional().default('open'),
});

export const trackLinkSchema = z.object({
  id: z.string().min(1, 'Link ID obrigatório'),
  url: urlSchema.optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type TrackLinkInput = z.infer<typeof trackLinkSchema>;

// =============================================================================
// SCHEMAS PARA GET-TRACKING-STATS
// =============================================================================

export const getTrackingStatsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  cursor_date: isoDateSchema.optional(),
  delivery_status: z.enum(['pending', 'delivered', 'bounced', 'failed']).optional(),
  search: stringSchema(100).optional(),
  date_from: isoDateSchema.optional(),
  date_to: isoDateSchema.optional(),
});

export type GetTrackingStatsInput = z.infer<typeof getTrackingStatsSchema>;

// =============================================================================
// SCHEMAS PARA BITRIX24-SYNC
// =============================================================================

export const bitrix24SyncSchema = z.object({
  action: z.enum(['sync_contact', 'create_activity', 'create_deal']),
  data: z.record(z.unknown()),
});

export const bitrix24SyncContactSchema = z.object({
  email: emailSchema,
  name: stringSchema(200).optional(),
  phone: stringSchema(20).optional(),
  company: stringSchema(200).optional(),
});

export const bitrix24SyncActivitySchema = z.object({
  type: z.enum(['email_open', 'link_click', 'document_view']),
  subject: stringSchema(500),
  contactEmail: emailSchema,
  metadata: z.record(z.unknown()).optional(),
});

export const bitrix24SyncDealSchema = z.object({
  title: stringSchema(500),
  contactEmail: emailSchema,
  value: positiveNumberSchema.optional(),
  currency: z.string().length(3).optional().default('BRL'),
});

export type Bitrix24SyncInput = z.infer<typeof bitrix24SyncSchema>;
export type Bitrix24SyncContactInput = z.infer<typeof bitrix24SyncContactSchema>;
export type Bitrix24SyncActivityInput = z.infer<typeof bitrix24SyncActivitySchema>;
export type Bitrix24SyncDealInput = z.infer<typeof bitrix24SyncDealSchema>;

// =============================================================================
// SCHEMAS PARA WEBHOOK-DISPATCH
// =============================================================================

export const webhookDispatchSchema = z.object({
  event: z.enum([
    'email.opened',
    'email.clicked',
    'email.bounced',
    'document.viewed',
    'link.clicked',
  ]),
  payload: z.record(z.unknown()),
  webhookUrl: urlSchema,
  secret: stringSchema(100).optional(),
});

export type WebhookDispatchInput = z.infer<typeof webhookDispatchSchema>;

// =============================================================================
// SCHEMAS PARA LOG-EMAIL-ACTIVITY
// =============================================================================

export const logEmailActivitySchema = z.object({
  action: z.enum(['send', 'receive', 'forward', 'reply', 'archive', 'delete']),
  emailSubject: stringSchema(500),
  emailFrom: emailSchema,
  emailTo: z.array(emailSchema).min(1, 'Pelo menos um destinatário'),
  direction: z.enum(['inbound', 'outbound']),
  metadata: z.record(z.unknown()).optional(),
});

export type LogEmailActivityInput = z.infer<typeof logEmailActivitySchema>;

// =============================================================================
// SCHEMAS PARA REPORT-BOUNCE
// =============================================================================

export const reportBounceSchema = z.object({
  trackingId: z.string().min(1),
  bounceType: z.enum(['hard', 'soft', 'complaint', 'unknown']),
  bounceReason: stringSchema(1000).optional(),
  originalRecipient: emailSchema.optional(),
});

export type ReportBounceInput = z.infer<typeof reportBounceSchema>;

// =============================================================================
// SCHEMAS PARA TRACK-DOCUMENT
// =============================================================================

export const trackDocumentSchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(['view', 'download', 'print', 'share']).optional().default('view'),
  page: z.number().int().min(1).optional(),
  duration: z.number().min(0).optional(),
});

export type TrackDocumentInput = z.infer<typeof trackDocumentSchema>;

// =============================================================================
// SCHEMAS PARA GEO-LOOKUP
// =============================================================================

export const geoLookupSchema = z.object({
  ip: z.string().ip({ version: 'v4' }).or(z.string().ip({ version: 'v6' })),
});

export type GeoLookupInput = z.infer<typeof geoLookupSchema>;

// =============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// =============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export function validationErrorResponse(
  errors: Array<{ path: string; message: string }>
): Response {
  return new Response(
    JSON.stringify({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: errors,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Response | T {
  const result = validate(schema, data);
  
  if (!result.success) {
    return validationErrorResponse(result.errors!);
  }
  
  return result.data!;
}

export function sanitizeForLogging<T extends Record<string, unknown>>(
  data: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'authorization']
): T {
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field as keyof T] = '[REDACTED]' as T[keyof T];
    }
  }
  
  return sanitized;
}

export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}
