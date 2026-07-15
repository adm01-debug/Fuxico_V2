// Edge function: refresh-stats — refresh manual da MV com service_role
// Requer JWT válido de usuário autenticado. Não expõe dados sensíveis.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "missing_authorization" }, 401);
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anonClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u, error: uerr } = await anonClient.auth.getUser();
    if (uerr || !u?.user) return json({ error: "invalid_token" }, 401);

    const admin = createClient(SUPABASE_URL, SR, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await admin.rpc("refresh_email_stats_mv");
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "internal" }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
