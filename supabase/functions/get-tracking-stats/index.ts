import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';
import { protectedHandler } from '../_shared/security-middleware.ts';

const log = createLogger('get-tracking-stats');

const StatsQuerySchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  lastId: z.string().uuid().optional(),
  lastTimestamp: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["all", "opened", "clicked", "bounced"]).default("all"),
  search: z.string().max(200).optional(),
});

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
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
      lastId: url.searchParams.get("lastId") || undefined,
      lastTimestamp: url.searchParams.get("lastTimestamp") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      status: url.searchParams.get("status") || "all",
      search: url.searchParams.get("search") || undefined,
    };

    const validation = StatsQuerySchema.safeParse(params);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { limit, lastId, lastTimestamp, startDate, endDate, status, search } = validation.data;

    const { data, error } = await supabase.rpc("get_emails_with_stats", {
      p_user_id: user.id,
      p_limit: limit,
      p_last_id: lastId ?? null,
      p_last_timestamp: lastTimestamp ?? null,
      p_status: status === "all" ? null : status,
      p_search: search ?? null,
      p_start_date: startDate ?? null,
      p_end_date: endDate ?? null,
    });

    if (error) {
      log.error('Database error', error);
      return secureErrorResponse("Database error", 500, corsHeaders);
    }

    const last = data && data.length === limit ? data[data.length - 1] : null;
    const nextCursor = last
      ? { lastId: last.id, lastTimestamp: last.created_at }
      : null;

    return secureJsonResponse({
      emails: data || [],
      pagination: { limit, nextCursor, hasMore: !!nextCursor }
    }, corsHeaders);
  } catch (error) {
    log.error('Internal error', error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
