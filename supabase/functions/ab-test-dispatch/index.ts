// FUXICO — Motor de despacho de testes A/B com holdout determinístico
// Cron-only endpoint. Verify JWT desabilitado; execução restrita ao service_role.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SegmentFilters {
  min_score?: number;
  score_levels?: string[];
  last_open_days?: number;
}

interface ABTestRow {
  id: string;
  user_id: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_body: string | null;
  variant_b_body: string | null;
  segment_filters: SegmentFilters | null;
  holdout_percent: number;
  min_sample_size: number;
  recipient_email: string | null;
  variant_a_sends: number;
  variant_b_sends: number;
}

// Hash determinístico FNV-1a → 0..999
function hashBucket(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1000;
}

async function dispatchTest(admin: ReturnType<typeof createClient>, test: ABTestRow) {
  const filters = test.segment_filters ?? {};
  const holdoutCutoff = Math.round((test.holdout_percent ?? 10) * 10); // 0..500

  // 1) Seleciona audiência a partir de contact_scores do próprio user
  let query = admin
    .from("contact_scores")
    .select("email, engagement_score, score_level, last_interaction_at")
    .eq("user_id", test.user_id)
    .limit(500);

  if (typeof filters.min_score === "number") {
    query = query.gte("engagement_score", filters.min_score);
  }
  if (Array.isArray(filters.score_levels) && filters.score_levels.length) {
    query = query.in("score_level", filters.score_levels);
  }
  if (typeof filters.last_open_days === "number") {
    const cutoff = new Date(Date.now() - filters.last_open_days * 86400_000).toISOString();
    query = query.gte("last_interaction_at", cutoff);
  }

  const { data: contacts, error } = await query;
  if (error) throw error;

  const pool = (contacts ?? [])
    .map((c: { email?: string | null }) => (c.email ?? "").trim().toLowerCase())
    .filter((e: string) => e && e.includes("@"));

  // Cap defensivo: mínimo amostra × 2 (A+B), máximo 200 por rodada
  const target = Math.min(200, Math.max(test.min_sample_size * 2, 20));
  const audience = pool.slice(0, target);

  if (audience.length === 0) {
    return { dispatched: 0, holdout: 0, skipped: "empty_audience" };
  }

  const rows: Record<string, unknown>[] = [];
  let sentA = 0;
  let sentB = 0;
  let holdout = 0;

  for (const email of audience) {
    const bucket = hashBucket(`${test.id}:${email}`);
    if (bucket < holdoutCutoff) { holdout++; continue; }
    const isA = bucket % 2 === 0;
    const trackingId = crypto.randomUUID();
    const now = new Date().toISOString();
    rows.push({
      user_id: test.user_id,
      recipient_email: email,
      subject: isA ? test.variant_a_subject : test.variant_b_subject,
      body: (isA ? test.variant_a_body : test.variant_b_body) ?? "",
      scheduled_at: now,
      status: "pending",
      tracking_id: trackingId,
      metadata: {
        ab_test_id: test.id,
        variant: isA ? "A" : "B",
        dispatched_at: now,
      },
    });
    if (isA) sentA++; else sentB++;
  }

  if (rows.length > 0) {
    // upsert-like: ignora duplicatas pela exclusion constraint
    const { error: insertErr } = await admin.from("scheduled_emails").insert(rows);
    if (insertErr && !String(insertErr.message).toLowerCase().includes("exclude")) {
      throw insertErr;
    }
  }

  if (sentA > 0) {
    await admin.rpc("increment_ab_metrics", { p_id: test.id, p_variant: "A", p_sends: sentA });
  }
  if (sentB > 0) {
    await admin.rpc("increment_ab_metrics", { p_id: test.id, p_variant: "B", p_sends: sentB });
  }

  return { dispatched: rows.length, holdout, variant_a: sentA, variant_b: sentB };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey);

  // Autoriza somente cron interno (token compartilhado guardado em internal_config)
  const providedToken = req.headers.get("x-cron-token") ?? "";
  const { data: expected } = await admin.rpc("internal_get_config", { _key: "ab_dispatch_cron_token" });
  if (!expected || providedToken !== expected) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: tests, error } = await admin
    .from("ab_tests")
    .select("id,user_id,variant_a_subject,variant_b_subject,variant_a_body,variant_b_body,segment_filters,holdout_percent,min_sample_size,recipient_email,variant_a_sends,variant_b_sends")
    .eq("status", "running")
    .is("winner", null)
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown>[] = [];
  for (const t of (tests ?? []) as ABTestRow[]) {
    try {
      const r = await dispatchTest(admin, t);
      results.push({ test_id: t.id, ...r });
    } catch (e) {
      results.push({ test_id: t.id, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
