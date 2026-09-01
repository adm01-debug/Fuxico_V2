import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";

const log = createLogger("alert-dispatcher");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? '';
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
const SLACK_WEBHOOK_URL = Deno.env.get("ALERT_SLACK_WEBHOOK_URL") ?? "";
const LOOKBACK_MINUTES = Number(Deno.env.get("ALERT_LOOKBACK_MINUTES") ?? "60");
const MAX_EVENTS = Number(Deno.env.get("ALERT_MAX_EVENTS") ?? "50");

interface SecurityEventRow {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function sevEmoji(sev: string): string {
  if (sev === "critical") return "🔥";
  if (sev === "high") return "🚨";
  if (sev === "medium") return "⚠️";
  return "ℹ️";
}

function buildSlackPayload(events: SecurityEventRow[]) {
  const header = `*${events.length} alerta(s) de segurança* (últimos ${LOOKBACK_MINUTES}min)`;
  const lines = events.slice(0, 20).map((e) => {
    const meta = e.metadata ? ` \`${JSON.stringify(e.metadata).slice(0, 160)}\`` : "";
    return `${sevEmoji(e.severity)} *${e.severity.toUpperCase()}* — \`${e.event_type}\` — ${e.description}${meta}`;
  });
  return {
    text: header,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: header } },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } },
    ],
  };
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const since = new Date(Date.now() - LOOKBACK_MINUTES * 60_000).toISOString();

    // Buscar eventos high/critical recentes
    const { data: events, error: evErr } = await supabase
      .from("security_events")
      .select("id, event_type, severity, description, metadata, created_at")
      .in("severity", ["high", "critical"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_EVENTS);

    if (evErr) throw evErr;
    const list = (events ?? []) as SecurityEventRow[];

    if (list.length === 0) {
      return secureJsonResponse({ ok: true, dispatched: 0, skipped: 0, reason: "no_events" }, 200, cors);
    }

    // Filtrar eventos já despachados
    const ids = list.map((e) => e.id);
    const { data: alreadySent } = await supabase
      .from("alert_dispatch_log")
      .select("security_event_id")
      .eq("channel", "slack")
      .in("security_event_id", ids);

    const sentSet = new Set((alreadySent ?? []).map((r: { security_event_id: string }) => r.security_event_id));
    const pending = list.filter((e) => !sentSet.has(e.id));

    if (pending.length === 0) {
      return secureJsonResponse({ ok: true, dispatched: 0, skipped: list.length, reason: "all_sent" }, 200, cors);
    }

    // Se sem webhook configurado → registrar como skipped
    if (!SLACK_WEBHOOK_URL) {
      const rows = pending.map((e) => ({
        security_event_id: e.id,
        channel: "slack",
        status: "skipped" as const,
        error_message: "ALERT_SLACK_WEBHOOK_URL não configurado",
      }));
      await supabase.from("alert_dispatch_log").insert(rows);
      log.warn("Slack webhook não configurado; eventos marcados como skipped", { count: pending.length });
      return secureJsonResponse({ ok: true, dispatched: 0, skipped: pending.length, reason: "no_webhook" }, 200, cors);
    }

    // Enviar para Slack
    const payload = buildSlackPayload(pending);
    let dispatched = 0;
    let errMsg: string | null = null;
    try {
      const res = await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        errMsg = `slack_status_${res.status}`;
      } else {
        dispatched = pending.length;
      }
    } catch (err) {
      errMsg = err instanceof Error ? err.message : "unknown_error";
    }

    const rows = pending.map((e) => ({
      security_event_id: e.id,
      channel: "slack",
      status: errMsg ? ("failed" as const) : ("sent" as const),
      error_message: errMsg,
    }));
    await supabase.from("alert_dispatch_log").insert(rows);

    log.info("Alertas processados", { dispatched, failed: errMsg ? pending.length : 0 });

    return secureJsonResponse(
      { ok: !errMsg, dispatched, failed: errMsg ? pending.length : 0, error: errMsg },
      200,
      cors,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Falha no dispatcher", { error: msg });
    return secureErrorResponse(msg, 500, cors);
  }
});
