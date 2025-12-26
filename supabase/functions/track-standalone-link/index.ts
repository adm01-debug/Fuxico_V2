import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('track-standalone-link')
const StandaloneLinkSchema = z.object({
  shortCode: z.string().min(1).max(50)
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const rateLimit = await checkRateLimit(clientIP, "standalone", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const shortCode = url.pathname.split("/").pop() || url.searchParams.get("c");

    const validation = StandaloneLinkSchema.safeParse({ shortCode });
    if (!validation.success || !shortCode) {
      return secureErrorResponse("Invalid link", 400, corsHeaders);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: link } = await supabase.from("standalone_links").select("*").eq("short_code", shortCode).single();
    if (!link) return secureErrorResponse("Link not found", 404, corsHeaders);
    if (link.expires_at && new Date(link.expires_at) < new Date()) return secureErrorResponse("Link expired", 410, corsHeaders);

    await supabase.from("standalone_link_clicks").insert({
      link_id: link.id,
      ip_address: clientIP,
      user_agent: userAgent,
      referer: req.headers.get("referer")
    });

    await supabase.from("standalone_links").update({ click_count: (link.click_count || 0) + 1 }).eq("id", link.id);

    return Response.redirect(link.destination_url, 302);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
