// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('get-config')
const ConfigQuerySchema = z.object({
  keys: z.array(z.string()).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "config", 30, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const keys = url.searchParams.get("keys")?.split(",") || [];

    const validation = ConfigQuerySchema.safeParse({ keys: keys.length > 0 ? keys : undefined });
    if (!validation.success) return secureErrorResponse({ error: "Invalid parameters" }, 400, corsHeaders);

    const config = {
      version: "1.0.0",
      features: {
        tracking: true,
        documents: true,
        links: true,
        audit: true,
        bitrix24: true,
        zapier: true
      },
      limits: {
        maxEmailsPerDay: 1000,
        maxDocumentsPerMonth: 100,
        maxLinksPerEmail: 50
      },
      tracking: {
        pixelUrl: Deno.env.get("SUPABASE_URL") + "/functions/v1/track-pixel",
        linkUrl: Deno.env.get("SUPABASE_URL") + "/functions/v1/track-link"
      }
    };

    if (keys.length > 0) {
      const filteredConfig: Record<string, unknown> = {};
      keys.forEach(key => {
        if (key in config) filteredConfig[key] = (config as Record<string, unknown>)[key];
      });
      return secureJsonResponse(filteredConfig, corsHeaders);
    }

    return secureJsonResponse(config, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
