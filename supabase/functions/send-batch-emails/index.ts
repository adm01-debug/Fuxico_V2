import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { sanitizeEmailHtml } from "../_shared/html-sanitizer.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(512000).transform(html => sanitizeEmailHtml(html)),
  trackingEnabled: z.boolean().default(true)
});

const BatchEmailSchema = z.object({
  emails: z.array(EmailSchema).min(1).max(100),
  templateId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal")
});

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "batch-email", 5, 60);
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

    const body = await req.json();
    const validation = BatchEmailSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { emails, _templateId, scheduledAt, priority } = validation.data;

    const batchId = crypto.randomUUID();
    const results = emails.map((email, index) => ({
      id: crypto.randomUUID(),
      batchId,
      index,
      to: email.to,
      status: "queued",
      trackingId: email.trackingEnabled ? crypto.randomUUID() : null
    }));

    await supabase.from("email_batches").insert({
      id: batchId,
      user_id: user.id,
      total_count: emails.length,
      status: scheduledAt ? "scheduled" : "processing",
      scheduled_at: scheduledAt,
      priority
    });

    return secureJsonResponse({
      success: true,
      batchId,
      totalEmails: emails.length,
      status: scheduledAt ? "scheduled" : "processing",
      results
    }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
