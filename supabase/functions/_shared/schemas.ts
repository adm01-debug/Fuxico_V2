// =============================================================================
// FUXICO - Shared Zod Schemas for Edge Functions
// Arquivo: supabase/functions/_shared/schemas.ts
// Descricao: Schemas reutilizaveis com validacao segura
// =============================================================================

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Schema seguro para metadata generico.
 * Limita: profundidade 1, max 20 chaves, valores primitivos apenas.
 * Substitui z.record(z.unknown()) que aceita qualquer coisa.
 */
export const SafeMetadataSchema = z
  .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine(
    (obj) => Object.keys(obj).length <= 20,
    { message: "Metadata cannot have more than 20 keys" }
  )
  .optional()
  .default({});

/**
 * Schema para metadata com strings apenas (mais restritivo).
 */
export const StringMetadataSchema = z
  .record(z.string().max(1000))
  .refine(
    (obj) => Object.keys(obj).length <= 10,
    { message: "Metadata cannot have more than 10 keys" }
  )
  .optional()
  .default({});

/**
 * Common Edge Function Schemas
 */
export const CommonTrackingSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().max(500).optional(),
  senderEmail: z.string().email().optional(),
  links: z.array(z.string().url()).max(50).optional(),
  metadata: SafeMetadataSchema,
});

export const CommonEmailAuditSchema = z.object({
  userEmail: z.string().email(),
  direction: z.enum(['inbound', 'outbound']),
  senderEmail: z.string().email().optional(),
  recipientEmail: z.string().email().optional(),
  subject: z.string().max(500).optional(),
  externalDomain: z.string().max(255).optional(),
  isExternal: z.boolean().optional(),
  metadata: SafeMetadataSchema,
});

export const CommonBounceSchema = z.object({ 
  trackingId: z.string().uuid(), 
  bounceType: z.string().optional(), 
  bounceReason: z.string().optional() 
});

export const CommonWebhookDispatchSchema = z.object({
  userId: z.string().uuid(),
  eventType: z.enum(['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked']),
  payload: SafeMetadataSchema,
});

export const CommonDeliverabilitySchema = z.object({
  email: z.string().email(),
  checkMx: z.boolean().default(true),
  checkSyntax: z.boolean().default(true),
  checkDisposable: z.boolean().default(true)
});

export const CommonDomainSchema = z.object({
  domain: z.string().regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, "Invalid domain format"),
  verificationType: z.enum(["dns", "file", "meta"]).default("dns")
});

export const CommonWatermarkSchema = z.object({
  documentId: z.string().uuid(),
  watermarkText: z.string().min(1).max(200).transform(text =>
    text.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim()
  ),
  position: z.enum(["center", "diagonal", "footer"]).default("diagonal"),
  opacity: z.number().min(0.1).max(1).default(0.3),
  fontSize: z.number().min(8).max(72).default(48)
});

export const CommonCertificateSchema = z.object({
  trackingId: z.string().min(1),
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(200).optional(),
  deliveredAt: z.string().datetime().optional(),
  includeEvents: z.boolean().default(true),
  format: z.enum(["pdf", "html"]).default("pdf")
});

export const CommonSignedDocSchema = z.object({
  documentId: z.string().uuid(),
  signatureType: z.enum(["draw", "type", "upload"]).default("type"),
  signatureData: z.string().min(1),
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  signerIP: z.string().optional(),
  position: z.object({
    page: z.number().int().positive(),
    x: z.number(),
    y: z.number()
  }).optional()
});

export const CommonZapierSchema = z.object({
  event: z.enum(["email.opened", "email.clicked", "email.bounced", "document.viewed"]),
  trackingId: z.string().uuid(),
  data: SafeMetadataSchema,
});

export const CommonPushSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  icon: z.string().url().optional(),
  url: z.string().url().optional(),
  data: SafeMetadataSchema,
});

export const CommonSignerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  order: z.number().int().positive().optional()
});

export const CommonSignatureRequestSchema = z.object({
  documentId: z.string().uuid(),
  signers: z.array(CommonSignerSchema).min(1).max(10),
  message: z.string().max(1000).optional(),
  expiresAt: z.string().datetime().optional(),
  reminderDays: z.number().int().min(1).max(30).optional()
});
