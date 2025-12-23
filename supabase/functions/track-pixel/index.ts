import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TrackPixelSchema = z.object({
  t: z.string().min(1),
});

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b,
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(clientIP, "track-pixel", 200, 60);
    if (!rateLimitResult.allowed) {
      return new Response(PIXEL, {
        headers: { ...corsHeaders, "Content-Type": "image/gif" },
      });
    }

    const url = new URL(req.url);
    const params = { t: url.searchParams.get("t") || "" };
    
    const validatedData = TrackPixelSchema.parse(params);
    const trackingId = validatedData.t;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const userAgent = req.headers.get("user-agent") || "";
    const isSelfOpen = userAgent.includes("GoogleImageProxy") || 
                       userAgent.includes("YahooMailProxy");

    await supabase.from("tracking_events").insert({
      tracking_id: trackingId,
      event_type: "open",
      ip_address: clientIP,
      user_agent: userAgent,
      is_self_open: isSelfOpen,
    });

    return new Response(PIXEL, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return new Response(PIXEL, {
      headers: { ...corsHeaders, "Content-Type": "image/gif" },
    });
  }
});
