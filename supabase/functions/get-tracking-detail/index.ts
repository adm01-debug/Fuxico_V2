// =============================================================================
// FUXICO - Detalhe de rastreamento por tracking_id
// Usado pelo popover "Histórico completo de rastreamento" da extensão Gmail.
// Retorna SOMENTE eventos de e-mails pertencentes ao usuário autenticado.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from "../_shared/logger.ts";
import { protectedHandler } from "../_shared/security-middleware.ts";

const log = createLogger("get-tracking-detail");

const QuerySchema = z.object({
  trackingId: z.string().min(4).max(128).regex(/^[A-Za-z0-9_-]+$/),
  limit: z.number().int().min(1).max(200).default(100),
});

/** Classificação leve de user-agent — sem libs externas. */
function parseUserAgent(ua: string): { device: string; client: string } {
  const s = (ua || "").toLowerCase();
  let device = "Desktop";
  if (/ipad|tablet/.test(s)) device = "Tablet";
  else if (/iphone|android|mobile/.test(s)) device = "Celular";

  let client = "Navegador";
  if (/googleimageproxy/.test(s)) client = "Gmail";
  else if (/outlook|microsoft office/.test(s)) client = "Outlook";
  else if (/applemail|apple-mail/.test(s)) client = "Apple Mail";
  else if (/thunderbird/.test(s)) client = "Thunderbird";
  else if (/yahoo/.test(s)) client = "Yahoo Mail";
  else if (/edg\//.test(s)) client = "Edge";
  else if (/chrome\//.test(s)) client = "Chrome";
  else if (/firefox\//.test(s)) client = "Firefox";
  else if (/safari\//.test(s)) client = "Safari";

  return { device, client };
}

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "tracking-detail", 120, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const url = new URL(req.url);
    const validation = QuerySchema.safeParse({
      trackingId: url.searchParams.get("trackingId") ?? "",
      limit: parseInt(url.searchParams.get("limit") || "100", 10),
    });
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }
    const { trackingId, limit } = validation.data;

    // Ownership explícito (além do RLS pela sessão do usuário)
    const { data: email, error: emailError } = await supabase
      .from("tracked_emails")
      .select("tracking_id, recipient_email, subject, created_at, delivery_status, user_id")
      .eq("tracking_id", trackingId)
      .maybeSingle();

    if (emailError) {
      log.error("Erro ao buscar e-mail", emailError);
      return secureErrorResponse("Database error", 500, corsHeaders);
    }
    if (!email || email.user_id !== user.id) {
      return secureErrorResponse("Not found", 404, corsHeaders);
    }

    const [{ data: events }, { data: links }] = await Promise.all([
      supabase
        .from("tracking_events")
        .select("event_type, created_at, user_agent, is_self_open, link_url, metadata")
        .eq("tracking_id", trackingId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("tracked_links")
        .select("link_id, original_url, click_count")
        .eq("tracking_id", trackingId)
        .order("click_count", { ascending: false })
        .limit(50),
    ]);

    const rows = events ?? [];

    const timeline = rows.map((e) => {
      const { device, client } = parseUserAgent(e.user_agent ?? "");
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      return {
        type: e.event_type,
        at: e.created_at,
        device,
        client,
        isSelfOpen: !!e.is_self_open,
        linkUrl: e.link_url ?? null,
        country: (meta.country as string) ?? null,
        city: (meta.city as string) ?? null,
      };
    });

    const opens = timeline.filter((t) => t.type === "open");
    const realOpens = opens.filter((t) => !t.isSelfOpen);

    return secureJsonResponse(
      {
        email: {
          trackingId: email.tracking_id,
          recipientEmail: email.recipient_email,
          subject: email.subject,
          createdAt: email.created_at,
          deliveryStatus: email.delivery_status,
        },
        summary: {
          opens: realOpens.length,
          selfOpens: opens.length - realOpens.length,
          firstOpenAt: realOpens.length ? realOpens[realOpens.length - 1].at : null,
          lastOpenAt: realOpens.length ? realOpens[0].at : null,
          clicks: (links ?? []).reduce((acc, l) => acc + (l.click_count ?? 0), 0),
        },
        links: (links ?? []).map((l) => ({
          linkId: l.link_id,
          url: l.original_url,
          clicks: l.click_count ?? 0,
        })),
        timeline,
      },
      corsHeaders
    );
  } catch (error) {
    log.error("Internal error", error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
};

Deno.serve(protectedHandler(handler));
