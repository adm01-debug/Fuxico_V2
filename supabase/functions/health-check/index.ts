import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: boolean;
    cache: boolean;
  };
}

const startTime = Date.now();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Check database connectivity
    let dbHealthy = false;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: supabaseKey || "", Authorization: `Bearer ${supabaseKey}` },
      });
      dbHealthy = response.ok;
    } catch {
      dbHealthy = false;
    }

    const status: HealthStatus = {
      status: dbHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: dbHealthy,
        cache: true,
      },
    };

    const httpStatus = status.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(status), {
      status: httpStatus,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

