import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const CheckDeliverabilitySchema = z.object({
  email: z.string().email(),
  domain: z.string().optional(),
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "check-deliverability", 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validatedData = CheckDeliverabilitySchema.parse(body);

    const domain = validatedData.domain || validatedData.email.split("@")[1];
    
    // Check MX records
    const mxCheck = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const mxData = await mxCheck.json();
    const hasMX = mxData.Answer && mxData.Answer.length > 0;

    // Check SPF
    const spfCheck = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
    const spfData = await spfCheck.json();
    const hasSPF = spfData.Answer?.some((r: any) => r.data?.includes("v=spf1"));

    // Check DMARC
    const dmarcCheck = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`);
    const dmarcData = await dmarcCheck.json();
    const hasDMARC = dmarcData.Answer && dmarcData.Answer.length > 0;

    const score = (hasMX ? 40 : 0) + (hasSPF ? 30 : 0) + (hasDMARC ? 30 : 0);

    return new Response(JSON.stringify({
      email: validatedData.email,
      domain,
      deliverability: {
        score,
        hasMX,
        hasSPF,
        hasDMARC,
        recommendation: score >= 70 ? "Good" : score >= 40 ? "Fair" : "Poor",
      },
    }), {
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
