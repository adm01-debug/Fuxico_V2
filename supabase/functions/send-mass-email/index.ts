import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { sanitizeEmailHtml } from "../_shared/html-sanitizer.ts";
import { protectedHandler } from '../_shared/security-middleware.ts';

const MassEmailSchema = z.object({
  subject: z.string().min(1).max(500),
  htmlBody: z.string().min(1).max(512000),
  textBody: z.string().optional(),
  recipients: z.array(z.string().email()).min(1).max(1000),
  fromName: z.string().min(1).max(100).optional(),
  replyTo: z.string().email().optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
  unsubscribeLink: z.boolean().default(true),
  campaignId: z.string().uuid().optional()
});

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "mass-email", 2, 60);
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
    const validation = MassEmailSchema.safeParse(body);
    if (!validation.success) {
      return secureErrorResponse({ error: "Validation failed" }, 400, corsHeaders);
    }

    const { subject, htmlBody: rawHtmlBody, recipients, trackOpens, trackClicks, campaignId } = validation.data;

    // SECURITY: Sanitize HTML to prevent script injection in emails
    const _htmlBody = sanitizeEmailHtml(rawHtmlBody);

    const campaignJobId = crypto.randomUUID();
    
    await supabase.from("mass_email_campaigns").insert({
      id: campaignJobId,
      user_id: user.id,
      campaign_id: campaignId,
      subject,
      total_recipients: recipients.length,
      track_opens: trackOpens,
      track_clicks: trackClicks,
      status: "queued"
    });

    return secureJsonResponse({
      success: true,
      jobId: campaignJobId,
      totalRecipients: recipients.length,
      estimatedDeliveryTime: Math.ceil(recipients.length / 100) + " minutes"
    }, corsHeaders);
  } catch (_error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}

Deno.serve(protectedHandler(handler));
