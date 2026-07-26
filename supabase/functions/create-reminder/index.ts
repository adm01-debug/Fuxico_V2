// =============================================================================
// FUXICO - Criação de lembrete de follow-up a partir da extensão
// "Lembrar-me se não abrir em N dias"
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from "../_shared/logger.ts";
import { protectedHandler } from "../_shared/security-middleware.ts";

const log = createLogger("create-reminder");

const BodySchema = z.object({
  trackingId: z.string().min(4).max(128).regex(/^[A-Za-z0-9_-]+$/),
  reminderDays: z.number().int().min(1).max(30).default(3),
});

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    if (req.method !== "POST") {
      return secureErrorResponse("Method not allowed", 405, corsHeaders);
    }

    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "create-reminder", 60, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return secureErrorResponse("Unauthorized", 401, corsHeaders);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }
    const { trackingId, reminderDays } = parsed.data;

    const { data: email } = await supabase
      .from("tracked_emails")
      .select("tracking_id, user_id")
      .eq("tracking_id", trackingId)
      .maybeSingle();

    if (!email || email.user_id !== user.id) {
      return secureErrorResponse("Not found", 404, corsHeaders);
    }

    const { data, error } = await supabase
      .from("follow_up_reminders")
      .insert({ user_id: user.id, tracking_id: trackingId, reminder_days: reminderDays })
      .select("id, reminder_days")
      .single();

    if (error) {
      log.error("Erro ao criar lembrete", error);
      return secureErrorResponse("Database error", 500, corsHeaders);
    }

    return secureJsonResponse({ success: true, reminder: data }, corsHeaders);
  } catch (error) {
    log.error("Internal error", error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
};

Deno.serve(protectedHandler(handler));
