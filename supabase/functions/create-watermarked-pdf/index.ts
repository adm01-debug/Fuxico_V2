import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const WatermarkSchema = z.object({
const log = createLogger('create-watermarked-pdf')
  documentId: z.string().uuid(),
  watermarkText: z.string().min(1).max(200),
  position: z.enum(["center", "diagonal", "footer"]).default("diagonal"),
  opacity: z.number().min(0.1).max(1).default(0.3),
  fontSize: z.number().min(8).max(72).default(48)
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "watermark", 20, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json();
    const validation = WatermarkSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);
    }

    const { documentId, watermarkText, position, opacity, fontSize } = validation.data;

    const { data: doc } = await supabase.from("tracked_documents").select("*").eq("id", documentId).eq("user_id", user.id).single();
    if (!doc) return secureErrorResponse("Document not found", 404, corsHeaders);

    await supabase.from("tracked_documents").update({
      watermark_applied: true,
      watermark_config: { text: watermarkText, position, opacity, fontSize }
    }).eq("id", documentId);

    return secureJsonResponse({ success: true, documentId }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
