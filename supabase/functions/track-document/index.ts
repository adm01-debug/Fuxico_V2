// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
const TrackDocSchema = z.object({
  documentId: z.string().uuid(),
  eventType: z.enum(["view", "download", "print", "share"]).default("view"),
  pageNumber: z.number().int().positive().optional(),
  duration: z.number().int().min(0).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const rateLimit = await checkRateLimit(clientIP, "track-doc", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const body = await req.json();
    const validation = TrackDocSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);

    const { documentId, eventType, pageNumber, duration } = validation.data;
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    await supabase.from("document_events").insert({
      document_id: documentId,
      event_type: eventType,
      page_number: pageNumber,
      duration_seconds: duration,
      ip_address: clientIP,
      user_agent: userAgent
    });

    return secureJsonResponse({ success: true }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
