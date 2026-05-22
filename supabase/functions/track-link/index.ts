import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureErrorResponse } from "../_shared/security-headers.ts";
import { isUrlSafe } from "../_shared/url-validator.ts";
import { CommonTrackLinkSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const TrackLinkSchema = CommonTrackLinkSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    // 1. Detect prefetch
    const purpose = req.headers.get("purpose") || req.headers.get("x-purpose") || req.headers.get("sec-purpose") || "";
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    const url = new URL(req.url);
    const linkId = url.searchParams.get("l") || url.searchParams.get("linkId");
    const trackingId = url.searchParams.get("t") || url.searchParams.get("trackingId");

    const validation = TrackLinkSchema.safeParse({ linkId, trackingId });
    if (!validation.success || !linkId) {
      return secureErrorResponse("Invalid link", 400, corsHeaders);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // Fetch link first to get target URL for prefetch redirect
    let link = null;
    const { data: linkByLinkId } = await supabase.from("tracked_links").select("*").eq("link_id", linkId).single();
    
    if (linkByLinkId) {
      link = linkByLinkId;
    } else {
      const { data: linkById } = await supabase.from("tracked_links").select("*").eq("id", linkId).single();
      link = linkById;
    }
    
    if (!link) return secureErrorResponse("Link not found", 404, corsHeaders);

    // If prefetch, just redirect without tracking
    if (purpose === "prefetch" || purpose === "preview") {
      return Response.redirect(link.original_url, 302);
    }

    // 2. Rate limiting
    const rateLimit = await checkRateLimit(clientIP, "track-link", 30, 60);
    if (!rateLimit.allowed) return Response.redirect(link.original_url, 302);

    // 3. Deduplication: Check if there was a "click" event in the last 10 seconds for same link/IP
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { data: recentEvent } = await supabase
      .from("tracking_events")
      .select("id")
      .eq("tracking_id", trackingId || link.tracking_id)
      .eq("event_type", "click")
      .eq("ip_address", clientIP)
      .eq("link_url", link.original_url)
      .gt("created_at", tenSecondsAgo)
      .maybeSingle();

    if (!recentEvent) {
      await supabase.rpc("increment_link_click_count", { p_link_id: link.link_id }).catch(() => {
        supabase
          .from("tracked_links")
          .update({ click_count: (link.click_count || 0) + 1 })
          .eq("link_id", link.link_id);
      });

      await supabase.from("tracking_events").insert({
        tracking_id: trackingId || link.tracking_id,
        event_type: "click",
        link_url: link.original_url,
        ip_address: clientIP,
        user_agent: userAgent,
        is_self_open: false
      });
    }

    if (!isUrlSafe(link.original_url)) {
      return secureErrorResponse("Invalid redirect URL", 400, corsHeaders);
    }

    return Response.redirect(link.original_url, 302);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(publicHandler(handler));

