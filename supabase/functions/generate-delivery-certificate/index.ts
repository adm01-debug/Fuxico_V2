import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'
import { CommonCertificateSchema } from "../_shared/schemas.ts";

const log = createLogger('generate-delivery-certificate');
const CertificateSchema = CommonCertificateSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "certificate", 10, 60);
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
    const validation = CertificateSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { trackingId, recipientEmail, recipientName, includeEvents, format } = validation.data;

    const { data: email } = await supabase.from("tracked_emails")
      .select("*, tracking_events(*)")
      .eq("tracking_id", trackingId)
      .eq("user_id", user.id)
      .single();

    if (!email) return secureErrorResponse("Email not found", 404, corsHeaders);

    const certificate = {
      id: crypto.randomUUID(),
      trackingId,
      recipientEmail,
      recipientName: recipientName || email.recipient_email,
      deliveredAt: email.tracking_events?.[0]?.created_at || new Date().toISOString(),
      events: includeEvents ? email.tracking_events : [],
      generatedAt: new Date().toISOString(),
      generatedBy: user.id
    };

    return secureJsonResponse({ success: true, certificate, format }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
