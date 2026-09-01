import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';
import { extractTrackableLinks, injectTracking } from "../_shared/tracking-inject.ts";

const RecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  variables: z.record(z.string()).optional()
});

const MailMergeSchema = z.object({
  templateId: z.string().uuid(),
  recipients: z.array(RecipientSchema).min(1).max(500),
  subject: z.string().min(1).max(500),
  trackingEnabled: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  publicBaseUrl: z.string().url()
});

function renderVariables(body: string, vars: Record<string, string> | undefined): string {
  if (!vars) return body;
  return body.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "mail-merge", 3, 60);
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
    const validation = MailMergeSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { templateId, recipients, subject, trackingEnabled, scheduledAt, publicBaseUrl } = validation.data;

    const { data: template } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();
    if (!template) return secureErrorResponse("Template not found", 404, corsHeaders);

    const mergeId = crypto.randomUUID();
    const jobs = [] as Array<Record<string, unknown>>;

    for (const r of recipients) {
      const rawBody = renderVariables(template.body ?? "", r.variables);
      let trackingId: string | null = null;
      let renderedBody = rawBody;

      if (trackingEnabled) {
        trackingId = crypto.randomUUID();

        await supabase.from("tracked_emails").insert({
          tracking_id: trackingId,
          user_id: user.id,
          recipient_email: r.email,
          subject,
          sender_email: user.email,
          metadata: { merge_id: mergeId, template_id: templateId, source: "send-mail-merge" }
        });

        const originalLinks = extractTrackableLinks(rawBody);
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

        renderedBody = injectTracking(rawBody, {
          trackingId,
          baseUrl: publicBaseUrl,
          linkMap
        });
      }

      jobs.push({
        id: crypto.randomUUID(),
        merge_id: mergeId,
        recipient_email: r.email,
        recipient_name: r.name,
        variables: r.variables,
        tracking_id: trackingId,
        rendered_body: renderedBody,
        status: "pending"
      });
    }

    await supabase.from("mail_merge_jobs").insert(jobs);

    return secureJsonResponse({
      success: true,
      mergeId,
      totalRecipients: recipients.length,
      status: scheduledAt ? "scheduled" : "processing"
    }, corsHeaders);
  } catch (_error) {
    console.error("caught:", _error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
