// Edge function: admin-rpc — proxy service_role para funções admin_*
// Verifica JWT do chamador, valida role 'admin' via has_role, e só então
// chama a função solicitada com service_role. Elimina exposição direta das
// funções admin_* à role authenticated.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Allowlist explícito — nenhuma outra função é chamável via este endpoint
const ALLOWED = new Set([
  "admin_ops_dashboard",
  "admin_data_integrity_check",
  "admin_index_usage",
  "admin_blocking_queries",
  "admin_table_bloat",
  "admin_query_regressions",
  "admin_list_cron_failures",
  "admin_replay_cron_failure",
  "admin_alert_sanity_check",
  "reset_slow_query_stats",
  "db_health_check",
]);

interface RpcBody {
  fn: string;
  args?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "missing_authorization" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Verifica JWT com o cliente anon
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "invalid_token" }, 401);
    }
    const userId = userData.user.id;

    // 2) Verifica role admin usando service_role para não depender de RLS
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) return json({ error: "role_check_failed" }, 500);
    if (!isAdmin) {
      // Audita a tentativa
      await adminClient.rpc("log_security_event", {
        _user_id: userId,
        _event_type: "admin_rpc_forbidden",
        _severity: "high",
        _description: "Non-admin attempted admin-rpc call",
      });
      return json({ error: "forbidden" }, 403);
    }

    // 3) Valida body
    let body: RpcBody;
    try {
      body = (await req.json()) as RpcBody;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (!body?.fn || typeof body.fn !== "string" || !ALLOWED.has(body.fn)) {
      return json({ error: "fn_not_allowed" }, 400);
    }

    // 4) Chama a função com service_role
    const { data, error } = await adminClient.rpc(body.fn, body.args ?? {});
    if (error) return json({ error: error.message }, 400);

    return json({ data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "internal_error" }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
