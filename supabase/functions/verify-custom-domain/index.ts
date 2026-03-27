import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
const DomainSchema = z.object({
  domain: z.string().regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, "Invalid domain format"),
  verificationType: z.enum(["dns", "file", "meta"]).default("dns")
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "verify-domain", 10, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const body = await req.json();
    const validation = DomainSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { domain, verificationType } = validation.data;

    // SECURITY: Use full UUID for verification token (128 bits of entropy)
    // Previously used only 8 chars (32 bits) which is brute-forceable
    const verificationToken = `fuxico-verify-${crypto.randomUUID()}`;
    const verificationRecord = verificationType === "dns" ? `TXT _fuxico.${domain} = ${verificationToken}` : `/${verificationToken}.txt`;

    await supabase.from("custom_domains").upsert({
      user_id: user.id,
      domain,
      verification_type: verificationType,
      verification_token: verificationToken,
      status: "pending",
      updated_at: new Date().toISOString()
    });

    return secureJsonResponse({
      success: true,
      domain,
      verificationType,
      verificationInstructions: verificationType === "dns" 
        ? `Add TXT record: _fuxico.${domain} with value: ${verificationToken}`
        : `Upload file to: https://${domain}/${verificationToken}.txt`,
      token: verificationToken
    }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
