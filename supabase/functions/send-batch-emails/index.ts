import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { sanitizeEmailHtml } from "../_shared/html-sanitizer.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';
import { extractTrackableLinks, injectTracking } from "../_shared/tracking-inject.ts";

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
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  /** Origem pública usada pelos links do e-mail. Ex: https://open-receipt-ace.lovable.app */
  publicBaseUrl: z.string().url()
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

    const { emails, scheduledAt, priority, publicBaseUrl } = validation.data;
    const batchId = crypto.randomUUID();

    const results = [] as Array<{
      id: string;
      batchId: string;
      index: number;
      to: string;
      status: string;
      trackingId: string | null;
      renderedBody: string;
    }>;

    for (let index = 0; index < emails.length; index++) {
      const email = emails[index];
      const rowId = crypto.randomUUID();
      let renderedBody = email.body;
      let trackingId: string | null = null;

      if (email.trackingEnabled) {
        trackingId = crypto.randomUUID();

        // Registra o e-mail rastreado.
        await supabase.from("tracked_emails").insert({
          tracking_id: trackingId,
          user_id: user.id,
          recipient_email: email.to,
          subject: email.subject,
          sender_email: user.email,
          metadata: { batch_id: batchId, source: "send-batch-emails" }
        });

        // Persiste os tracked_links extraídos e monta o linkMap.
        const originalLinks = extractTrackableLinks(email.body);
        const linkMap: Record<string, string> = {};
        for (const original of originalLinks) {
          const linkId = crypto.randomUUID();
          const { error: linkErr } = await supabase.from("tracked_links").insert({
            link_id: linkId,
            tracking_id: trackingId,
            original_url: original,
            click_count: 0
          });
          if (!linkErr) linkMap[original] = linkId;
        }

        renderedBody = injectTracking(email.body, {
          trackingId,
          baseUrl: publicBaseUrl,
          linkMap
        });
      }

      results.push({
        id: rowId,
        batchId,
        index,
        to: email.to,
        status: "queued",
        trackingId,
        renderedBody
      });
    }

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
