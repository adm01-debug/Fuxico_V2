import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const TrackLinkSchema = z.object({
  l: z.string().uuid().optional(),
  linkId: z.string().uuid().optional(),
  trackingId: z.string().optional(),
}).refine(data => data.l || data.linkId, {
  message: "Either 'l' or 'linkId' must be provided"
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "track-link", 100, 60);
    if (!rateLimitResult.allowed) {
      return new Response(null, { status: 429, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const params = {
      l: url.searchParams.get("l") || undefined,
      linkId: url.searchParams.get("linkId") || undefined,
      trackingId: url.searchParams.get("trackingId") || undefined,
    };
    
    const validatedData = TrackLinkSchema.parse(params);
    const linkId = validatedData.l || validatedData.linkId;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: link } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("id", linkId)
      .single();

    if (!link) {
      return new Response("Link not found", { status: 404, headers: corsHeaders });
    }

    await supabase.from("link_click_events").insert({
      link_id: linkId,
      tracking_id: validatedData.trackingId,
      ip_address: clientIP,
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: link.destination_url },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid parameters", { status: 400, headers: corsHeaders });
    }
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
