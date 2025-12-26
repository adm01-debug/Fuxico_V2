import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('send-mail-merge')
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
  scheduledAt: z.string().datetime().optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
      return secureErrorResponse({ error: "Validation failed", details: validation.error.flatten() }, 400, corsHeaders);
    }

    const { templateId, recipients, subject, trackingEnabled, scheduledAt } = validation.data;

    const { data: template } = await supabase.from("email_templates").select("*").eq("id", templateId).eq("user_id", user.id).single();
    if (!template) return secureErrorResponse("Template not found", 404, corsHeaders);

    const mergeId = crypto.randomUUID();
    const jobs = recipients.map(r => ({
      id: crypto.randomUUID(),
      merge_id: mergeId,
      recipient_email: r.email,
      recipient_name: r.name,
      variables: r.variables,
      tracking_id: trackingEnabled ? crypto.randomUUID() : null,
      status: "pending"
    }));

    await supabase.from("mail_merge_jobs").insert(jobs);

    return secureJsonResponse({
      success: true,
      mergeId,
      totalRecipients: recipients.length,
      status: scheduledAt ? "scheduled" : "processing"
    }, corsHeaders);
  } catch (error) {
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
});
