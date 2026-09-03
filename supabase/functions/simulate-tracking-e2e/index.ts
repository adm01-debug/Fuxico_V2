// Edge function: simulate-tracking-e2e
// -----------------------------------------------------------------------------
// Executa uma simulação ponta-a-ponta do tracking de abertura em ambiente de
// staging. NÃO envia e-mails reais (zero risco de deliverability). Cria um
// tracked_email sintético e dispara N GETs no endpoint público track-pixel
// com IPs e User-Agents variados, dentro de janelas de tempo espaçadas para
// não acionar rate-limit (20/min por IP) nem deduplicação (janela de 5 min
// por IP).
//
// Restrito a admins via has_role(). Retorna relatório estruturado com
// contagem de eventos gerados, únicos, self-opens, latências e amostras.
// -----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UA_POOL = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
];

/** Jitter determinístico-seguro: usa CSPRNG apenas para espalhar o delay. */
const jitter = (base: number, spread: number) => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const offset = spread > 0 ? buf[0] % spread : 0;
  return new Promise((r) => setTimeout(r, base + offset));
};

const fakeIP = (i: number) =>
  // 10.99.x.x — bloco RFC1918 reservado, seguro para simulação
  `10.99.${Math.floor(i / 256) % 256}.${(i * 37 + 11) % 256}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // 1) Autenticação
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "missing_authorization" }, 401);

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: isAdmin } = await adminClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    await Promise.resolve(adminClient.rpc("log_security_event", {
      _user_id: userData.user.id,
      _event_type: "simulate_tracking_forbidden",
      _severity: "high",
      _description: "Non-admin tried to run E2E tracking simulation",
    });
    return json({ error: "forbidden" }, 403);
  }

  // 2) Parâmetros
  let body: {
    samples?: number;
    spread_ms?: number;
    cleanup?: boolean;
    include_dedup_test?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    // corpo vazio é aceitável — usa defaults
  }

  const samples = Math.min(Math.max(body.samples ?? 10, 1), 50);
  const spreadMs = Math.min(Math.max(body.spread_ms ?? 8000, 500), 120000);
  const cleanup = body.cleanup ?? false;
  const includeDedup = body.include_dedup_test ?? true;

  const runId = crypto.randomUUID();
  const startedAt = Date.now();

  // 3) Cria tracked_email sintético
  const trackingId = `sim_${runId.replace(/-/g, "").slice(0, 24)}`;
  const senderEmail = userData.user.email ?? "e2e-sim@fuxico.internal";
  const recipientEmail = `sim-${runId.slice(0, 8)}@e2e.fuxico.internal`;

  const { error: insertErr } = await adminClient.from("tracked_emails").insert({
    tracking_id: trackingId,
    recipient_email: recipientEmail,
    subject: "[E2E-SIM] Validação de rastreamento de abertura",
    sender_email: senderEmail,
    user_id: userData.user.id,
    delivery_status: "sent",
    metadata: { simulation: true, run_id: runId, purpose: "e2e_open_tracking" },
    // sender_ip fica null — assim nunca marca is_self_open indevidamente
  });

  if (insertErr) {
    return json({ error: "insert_failed", details: insertErr.message }, 500);
  }

  const pixelUrl = `${SUPABASE_URL}/functions/v1/track-pixel?t=${encodeURIComponent(trackingId)}`;
  const perSample = Math.floor(spreadMs / Math.max(samples, 1));

  const requestLog: Array<{
    idx: number;
    status: number;
    latency_ms: number;
    ip: string;
    ua_short: string;
  }> = [];

  // 4) Disparos com IPs únicos → não bate rate-limit nem dedup
  for (let i = 0; i < samples; i++) {
    const ip = fakeIP(i);
    const ua = UA_POOL[i % UA_POOL.length];
    const t0 = Date.now();
    try {
      const res = await fetch(pixelUrl, {
        method: "GET",
        headers: {
          "user-agent": ua,
          "x-forwarded-for": ip,
          "accept": "image/gif,image/*;q=0.9,*/*;q=0.5",
        },
      });
      // Consome o corpo para não vazar recursos
      await res.arrayBuffer();
      requestLog.push({
        idx: i,
        status: res.status,
        latency_ms: Date.now() - t0,
        ip,
        ua_short: ua.slice(0, 40),
      });
    } catch (e) {
      requestLog.push({
        idx: i,
        status: 0,
        latency_ms: Date.now() - t0,
        ip,
        ua_short: `err:${(e as Error).message.slice(0, 30)}`,
      });
    }
    if (i < samples - 1) await jitter(perSample, 250);
  }

  // 4b) Teste de dedup: repete o primeiro IP dentro da janela de 5min
  let dedupResult: { attempted: boolean; extra_events_created: number } = {
    attempted: false,
    extra_events_created: 0,
  };
  if (includeDedup && samples > 0) {
    const ip = fakeIP(0);
    const before = await adminClient
      .from("tracking_events")
      .select("id", { count: "exact", head: true })
      .eq("tracking_id", trackingId)
      .eq("event_type", "open")
      .eq("ip_address", ip);

    await fetch(pixelUrl, {
      method: "GET",
      headers: {
        "user-agent": UA_POOL[0],
        "x-forwarded-for": ip,
      },
    }).then((r) => r.arrayBuffer()).catch(() => null);

    const after = await adminClient
      .from("tracking_events")
      .select("id", { count: "exact", head: true })
      .eq("tracking_id", trackingId)
      .eq("event_type", "open")
      .eq("ip_address", ip);

    dedupResult = {
      attempted: true,
      extra_events_created: (after.count ?? 0) - (before.count ?? 0),
    };
  }

  // 5) Coleta resultados
  const { data: events, error: evErr } = await adminClient
    .from("tracking_events")
    .select("id, ip_address, user_agent, is_self_open, created_at")
    .eq("tracking_id", trackingId)
    .eq("event_type", "open")
    .order("created_at", { ascending: true });

  if (evErr) {
    return json({ error: "events_read_failed", details: evErr.message }, 500);
  }

  const uniqueIps = new Set((events ?? []).map((e) => e.ip_address)).size;
  const selfOpens = (events ?? []).filter((e) => e.is_self_open).length;

  const httpOk = requestLog.filter((r) => r.status === 200).length;
  const latencies = requestLog.map((r) => r.latency_ms).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;

  // 6) Verifica get-tracking-stats retorna coerente (se existir a RPC/função)
  let statsCheck: unknown = null;
  try {
    const { data: stats } = await adminClient
      .from("tracked_emails")
      .select("tracking_id, recipient_email")
      .eq("tracking_id", trackingId)
      .maybeSingle();
    statsCheck = { tracked_email_visible: !!stats };
  } catch (err) {
    console.warn('stats check failed', err);
    statsCheck = { tracked_email_visible: false };
  }

  // 7) Cleanup opcional
  let cleanupReport: unknown = null;
  if (cleanup) {
    const { error: delEvErr, count: delEvCount } = await adminClient
      .from("tracking_events")
      .delete({ count: "exact" })
      .eq("tracking_id", trackingId);
    const { error: delEmErr } = await adminClient
      .from("tracked_emails")
      .delete()
      .eq("tracking_id", trackingId);
    cleanupReport = {
      events_deleted: delEvCount ?? 0,
      events_error: delEvErr?.message ?? null,
      email_error: delEmErr?.message ?? null,
    };
  }

  // 8) Auditoria
  await Promise.resolve(adminClient.rpc("log_security_event", {
    _user_id: userData.user.id,
    _event_type: "simulate_tracking_run",
    _severity: "low",
    _description: `E2E open-tracking simulation ${runId} — samples=${samples}, opens=${events?.length ?? 0}`,
  })).catch(() => null);

  const durationMs = Date.now() - startedAt;

  // 9) Veredicto automático
  const expectedOpens = samples; // 1 evento por IP único
  const opens = events?.length ?? 0;
  const isPerfect =
    opens === expectedOpens && dedupResult.extra_events_created === 0 && selfOpens === 0;
  const isAcceptable = opens >= Math.floor(expectedOpens * 0.9);
  let verdict: "PASS" | "PARTIAL" | "FAIL" = "FAIL";
  if (isPerfect) verdict = "PASS";
  else if (isAcceptable) verdict = "PARTIAL";

  return json({
    ok: true,
    verdict,
    run_id: runId,
    tracking_id: trackingId,
    duration_ms: durationMs,
    params: { samples, spread_ms: spreadMs, cleanup, include_dedup_test: includeDedup },
    http: {
      requests_sent: requestLog.length,
      status_200: httpOk,
      latency_p50_ms: p50,
      latency_p95_ms: p95,
    },
    tracking: {
      opens_recorded: opens,
      unique_ips: uniqueIps,
      self_opens: selfOpens,
      expected_opens: expectedOpens,
    },
    dedup: dedupResult,
    stats_check: statsCheck,
    cleanup: cleanupReport,
    samples_preview: (events ?? []).slice(0, 5).map((e) => ({
      ip: e.ip_address,
      is_self_open: e.is_self_open,
      created_at: e.created_at,
    })),
    request_log: requestLog,
    notes: [
      "Sem envio SMTP — zero impacto de deliverability.",
      "IPs 10.99.x.x são RFC1918, isolados de qualquer reputação real.",
      "Cada IP é único → evita rate-limit (20/min) e janela de dedup (5min).",
      "Domínio recipient .e2e.fuxico.internal é sintético e não roteável.",
    ],
  });
});
