// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('zapier-webhook')
const ZapierSchema = z.object({
  event: z.enum(["email.opened", "email.clicked", "email.bounced", "document.viewed"]),
  trackingId: z.string().min(1),
  data: z.record(z.unknown()).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
