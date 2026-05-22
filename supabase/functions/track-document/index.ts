import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { CommonTrackDocSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const TrackDocSchema = CommonTrackDocSchema;

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    // 1. Detect prefetch
    const purpose = req.headers.get("purpose") || req.headers.get("x-purpose") || req.headers.get("sec-purpose") || "";
    if (purpose === "prefetch" || purpose === "preview") {
      return secureJsonResponse({ success: true, cached: true }, corsHeaders);
    }

    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const rateLimit = await checkRateLimit(clientIP, "track-doc", 100, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const body = await req.json();
    const validation = TrackDocSchema.safeParse(body);
    if (!validation.success) return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);

    const { documentId, eventType, pageNumber, duration } = validation.data;
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: doc } = await supabase.from("tracked_documents").select("id").eq("document_id", documentId).single();
    if (!doc) return secureErrorResponse("Document not found", 404, corsHeaders);

    // 2. Deduplication: For document duration/page events, we might allow multiple,
    // but for 'view' events we can deduplicate by IP within a short window.
    if (eventType === "view") {
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      const { data: recentEvent } = await supabase
        .from("document_events")
        .select("id")
        .eq("document_id", documentId)
        .eq("event_type", "view")
        .eq("ip_address", clientIP)
        .gt("created_at", tenSecondsAgo)
        .maybeSingle();

      if (recentEvent) {
        return secureJsonResponse({ success: true, duplicate: true }, corsHeaders);
      }
    }

    await supabase.from("document_events").insert({
      document_id: documentId,
      event_type: eventType,
      page_number: pageNumber,
      duration_seconds: duration,
      ip_address: clientIP,
      user_agent: userAgent
    });

    return secureJsonResponse({ success: true }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(publicHandler(handler));

