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
