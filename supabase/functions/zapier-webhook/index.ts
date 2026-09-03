// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { publicHandler } from '../_shared/security-middleware.ts';
import { z } from "https://esm.sh/zod@3.23.8";
import { SafeMetadataSchema } from '../_shared/schemas.ts';

const ZapierSchema = z.object({
  event: z.string().min(1).max(120),
  trackingId: z.string().uuid().optional(),
  data: SafeMetadataSchema.optional(),
});

Deno.serve(publicHandler(async (req, corsHeaders) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "zapier", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) return secureErrorResponse("API key required", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: apiKeyRecord } = await supabase.from("api_keys").select("*").eq("key", apiKey).eq("is_active", true).single();
    if (!apiKeyRecord) return secureErrorResponse("Invalid API key", 401, corsHeaders);

    const body = await req.json();
    const validation = ZapierSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { event, trackingId, data } = validation.data;

    await supabase.from("webhook_logs").insert({
      user_id: apiKeyRecord.user_id,
      source: "zapier",
      event_type: event,
      tracking_id: trackingId,
      payload: data,
      ip_address: clientIP
    });

    return secureJsonResponse({ success: true, event, trackingId }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}));
