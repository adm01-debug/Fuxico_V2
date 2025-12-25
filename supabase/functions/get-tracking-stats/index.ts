import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";

const StatsQuerySchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
  cursor: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["all", "opened", "clicked", "bounced"]).default("all")
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "tracking-stats", 60, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const url = new URL(req.url);
    const params = {
      limit: parseInt(url.searchParams.get("limit") || "100"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
      cursor: url.searchParams.get("cursor") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      status: url.searchParams.get("status") || "all"
    };

    const validation = StatsQuerySchema.safeParse(params);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);
    }

    const { limit, offset, cursor, startDate, endDate, status } = validation.data;

    const { data, error } = await supabase.rpc("get_emails_with_stats", {
      p_user_id: user.id,
      p_limit: limit,
      p_offset: offset,
      p_cursor_date: cursor || null
    });

    if (error) return secureErrorResponse("Database error", 500, corsHeaders);

    const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null;

    return secureJsonResponse({
      emails: data || [],
      pagination: { limit, offset, nextCursor, hasMore: !!nextCursor }
    }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
