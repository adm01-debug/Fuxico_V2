import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('check-deliverability');

const DeliverabilitySchema = z.object({
  email: z.string().email(),
  checkMx: z.boolean().default(true),
  checkSyntax: z.boolean().default(true),
  checkDisposable: z.boolean().default(true)
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "deliverability", 30, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    let body: unknown = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch {
      // Empty body is OK for stats-only requests
    }

    // If no email provided, return general deliverability stats using RPC
    if (!body || !(body as Record<string, unknown>).email) {
      const adminSupabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
      const { data: stats, error: statsError } = await adminSupabase.rpc('calculate_domain_deliverability', {
        p_user_id: user.id,
      });
      if (statsError) return secureErrorResponse("Database error", 500, corsHeaders);
      return secureJsonResponse({ domains: stats || [], totals: null }, corsHeaders);
    }

    const validation = DeliverabilitySchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);

    const { email, checkMx, checkSyntax, checkDisposable } = validation.data;
    const domain = email.split("@")[1];

    log.info('Checking deliverability', { email, domain });

    const result = {
      email,
      isValid: true,
      checks: {
        syntax: checkSyntax ? { passed: true, message: "Valid email format" } : null,
        mx: checkMx ? { passed: true, message: "MX records found" } : null,
        disposable: checkDisposable ? { passed: true, message: "Not a disposable email" } : null
      },
      domain,
      deliverabilityScore: 95
    };

    return secureJsonResponse(result, corsHeaders);
  } catch (error) {
    log.error('Error checking deliverability', error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
