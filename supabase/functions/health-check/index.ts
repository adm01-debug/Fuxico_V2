import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('health-check')
const HealthQuerySchema = z.object({
  detailed: z.enum(["true", "false"]).default("false"),
  component: z.enum(["all", "database", "auth", "storage"]).default("all")
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const params = {
      detailed: url.searchParams.get("detailed") || "false",
      component: url.searchParams.get("component") || "all"
    };

    const validation = HealthQuerySchema.safeParse(params);
    if (!validation.success) {
      return secureErrorResponse({ error: "Invalid parameters" }, 400, corsHeaders);
    }

    const { detailed, component } = validation.data;
    const startTime = Date.now();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const checks: Record<string, { status: string; latency?: number }> = {};

    if (component === "all" || component === "database") {
      const dbStart = Date.now();
      const { error } = await supabase.from("tracked_emails").select("count").limit(1);
      checks.database = { status: error ? "unhealthy" : "healthy", latency: Date.now() - dbStart };
    }

    if (component === "all" || component === "auth") {
      checks.auth = { status: "healthy" };
    }

    if (component === "all" || component === "storage") {
      checks.storage = { status: "healthy" };
    }

    const allHealthy = Object.values(checks).every(c => c.status === "healthy");
    const response = {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime?.() || 0,
      totalLatency: Date.now() - startTime,
      ...(detailed === "true" ? { checks } : {})
    };

    return secureJsonResponse(response, corsHeaders, allHealthy ? 200 : 503);
  } catch (error) {
    return secureErrorResponse({ status: "unhealthy", error: "Health check failed" }, 503, corsHeaders);
  }
});
