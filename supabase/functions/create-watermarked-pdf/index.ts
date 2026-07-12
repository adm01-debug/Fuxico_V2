import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'
import { CommonWatermarkSchema } from "../_shared/schemas.ts";

const _log = createLogger('create-watermarked-pdf')
const WatermarkSchema = CommonWatermarkSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
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
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { documentId, watermarkText, position, opacity, fontSize } = validation.data;

    const { data: doc } = await supabase.from("tracked_documents").select("*").eq("id", documentId).eq("user_id", user.id).single();
    if (!doc) return secureErrorResponse("Document not found", 404, corsHeaders);

    await supabase.from("tracked_documents").update({
      watermark_applied: true,
      watermark_config: { text: watermarkText, position, opacity, fontSize }
    }).eq("id", documentId);

    return secureJsonResponse({ success: true, documentId }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
