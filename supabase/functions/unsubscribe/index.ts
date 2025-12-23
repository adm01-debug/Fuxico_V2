import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const UnsubscribeSchema = z.object({
  email: z.string().email(),
  trackingId: z.string().optional(),
  reason: z.string().max(500).optional(),
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "unsubscribe", 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body;
    if (req.method === "GET") {
      const url = new URL(req.url);
      body = {
        email: url.searchParams.get("email") || "",
        trackingId: url.searchParams.get("trackingId") || undefined,
        reason: url.searchParams.get("reason") || undefined,
      };
    } else {
      body = await req.json();
    }

    const validatedData = UnsubscribeSchema.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error } = await supabase.from("unsubscribed_emails").upsert({
      email: validatedData.email,
      tracking_id: validatedData.trackingId,
      reason: validatedData.reason,
      unsubscribed_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (error) throw error;

    if (req.method === "GET") {
      return new Response(`
        <html>
          <head><title>Unsubscribed</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>✓ Successfully Unsubscribed</h1>
            <p>You will no longer receive emails from this sender.</p>
          </body>
        </html>
      `, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Validation error", details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
