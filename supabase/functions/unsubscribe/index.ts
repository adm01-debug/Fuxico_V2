import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('unsubscribe')
const UnsubSchema = z.object({
  token: z.string().min(1),
  email: z.string().email().optional(),
  reason: z.string().max(500).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "unsub", 20, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const token = url.searchParams.get("token") || url.searchParams.get("t");
    let body = {};
    if (req.method === "POST") body = await req.json();

    const validation = UnsubSchema.safeParse({ token, ...body });
    if (!validation.success || !token) {
      return secureErrorResponse("Invalid unsubscribe request", 400, corsHeaders);
    }

    const { reason } = validation.data;
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: sub } = await supabase.from("email_subscriptions").select("*").eq("unsubscribe_token", token).single();
    if (!sub) return secureErrorResponse("Invalid token", 404, corsHeaders);

    await supabase.from("email_subscriptions").update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason,
      unsubscribe_ip: clientIP
    }).eq("id", sub.id);

    if (req.headers.get("accept")?.includes("text/html")) {
      return new Response(`
        <!DOCTYPE html>
        <html><head><title>Unsubscribed</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Successfully Unsubscribed</h1>
          <p>You have been removed from our mailing list.</p>
        </body></html>
      `, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
    }

    return secureJsonResponse({ success: true, message: "Successfully unsubscribed" }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
