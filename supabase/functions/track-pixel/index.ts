import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { CommonTrackPixelSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const TrackPixelSchema = CommonTrackPixelSchema;

const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

Deno.serve(publicHandler(async (req, corsHeaders) => {
  const headers = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff"
  };

  try {
    // 1. Detect prefetch and other non-user loads
    const purpose = req.headers.get("purpose") || req.headers.get("x-purpose") || req.headers.get("sec-purpose") || "";
    if (purpose === "prefetch" || purpose === "preview") {
      return new Response(TRANSPARENT_GIF, { headers });
    }

    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    // 2. Rate limiting (stricter for pixel)
    const rateLimit = await checkRateLimit(clientIP, "pixel", 20, 60); // Reduced from 50 to 20 per minute
    if (!rateLimit.allowed) {
      console.warn(`[RateLimit] Pixel block for IP: ${clientIP}`);
      return new Response(TRANSPARENT_GIF, { headers });
    }

    const url = new URL(req.url);
    const trackingId = url.searchParams.get("t");

    const validation = TrackPixelSchema.safeParse({ t: trackingId });
    if (!validation.success || !trackingId) {
      return new Response(TRANSPARENT_GIF, { headers });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // 3. Robust Deduplication: Check if there was an "open" event in the last 5 minutes from same IP/trackingId
    // Increased from 60s to 300s to handle aggressive mail client pre-fetching and repeat opens
    const dedupeWindow = new Date(Date.now() - 300000).toISOString();
    const { data: recentEvent } = await supabase
      .from("tracking_events")
      .select("id")
      .eq("tracking_id", trackingId)
      .eq("event_type", "open")
      .eq("ip_address", clientIP)
      .gt("created_at", dedupeWindow)
      .maybeSingle();

    if (recentEvent) {
      return new Response(TRANSPARENT_GIF, { headers });
    }

    const { data: email } = await supabase.from("tracked_emails").select("user_id, sender_email, sender_ip").eq("tracking_id", trackingId).single();

    // Self-open detection
    const isSelfOpen = !!(email?.sender_ip && clientIP === email.sender_ip);

    await supabase.from("tracking_events").insert({
      tracking_id: trackingId,
      event_type: "open",
      ip_address: clientIP,
      user_agent: userAgent,
      is_self_open: isSelfOpen || false
    });

    return new Response(TRANSPARENT_GIF, { headers });
  } catch (error) {
    return new Response(TRANSPARENT_GIF, { headers: { ...headers, ...corsHeaders } });
  }
}));

