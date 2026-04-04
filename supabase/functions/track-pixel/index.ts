import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
const TrackPixelSchema = z.object({
  t: z.string().min(1)
});

const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

serve(async (req) => {
  const headers = {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff"
  };

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    const rateLimit = await checkRateLimit(clientIP, "pixel", 200, 60);
    if (!rateLimit.allowed) return new Response(TRANSPARENT_GIF, { headers });

    const url = new URL(req.url);
    const trackingId = url.searchParams.get("t");

    const validation = TrackPixelSchema.safeParse({ t: trackingId });
    if (!validation.success || !trackingId) {
      return new Response(TRANSPARENT_GIF, { headers });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: email } = await supabase.from("tracked_emails").select("user_id, sender_email, sender_ip").eq("tracking_id", trackingId).single();

    // Self-open detection: compare client IP with stored sender IP (not email)
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
    return new Response(TRANSPARENT_GIF, { headers });
  }
});
