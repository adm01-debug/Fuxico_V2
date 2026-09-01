import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts'
import { CommonUnsubSchema } from "../_shared/schemas.ts";
import { publicHandler } from '../_shared/security-middleware.ts';

const log = createLogger('unsubscribe')

const UnsubSchema = CommonUnsubSchema;

Deno.serve(publicHandler(async (req, corsHeaders) => {
  try {
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "unsub", 20, 60);
    if (!rateLimit.allowed) return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);

    const url = new URL(req.url);
    const trackingId = url.searchParams.get("t") || url.searchParams.get("trackingId");
    const emailParam = url.searchParams.get("email");
    
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
    }

    const validation = UnsubSchema.safeParse({ 
      trackingId: trackingId || body.trackingId, 
      email: emailParam || body.email,
      reason: body.reason 
    });
    
    if (!validation.success) {
      return secureErrorResponse("Invalid unsubscribe request", 400, corsHeaders);
    }

    const { reason } = validation.data;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the email to unsubscribe - either by tracking_id or direct email
    let emailToUnsubscribe: string | null = null;
    let userId: string | null = null;

    if (trackingId) {
      // Look up email from tracked_emails
      const { data: trackedEmail } = await supabase
        .from("tracked_emails")
        .select("recipient_email, user_id")
        .eq("tracking_id", trackingId)
        .single();
      
      if (trackedEmail) {
        emailToUnsubscribe = trackedEmail.recipient_email;
        userId = trackedEmail.user_id;
      }
    } else if (validation.data.email) {
      emailToUnsubscribe = validation.data.email;
    }

    if (!emailToUnsubscribe) {
      return secureErrorResponse("Email not found or invalid request", 404, corsHeaders);
    }

    // Check if already unsubscribed
    const { data: existing } = await supabase
      .from("unsubscribed_emails")
      .select("id")
      .eq("email", emailToUnsubscribe)
      .maybeSingle();

    if (existing) {
      log.info('Email already unsubscribed', { email: emailToUnsubscribe });
      // Still return success - idempotent operation
    } else {
      // Insert into unsubscribed_emails
      const { error: insertError } = await supabase
        .from("unsubscribed_emails")
        .insert({
          email: emailToUnsubscribe,
          user_id: userId || '00000000-0000-0000-0000-000000000000', // System user if unknown
          reason: reason || null,
          source: 'unsubscribe_link',
          tracking_id: trackingId || null,
          unsubscribed_at: new Date().toISOString()
        });

      if (insertError) {
        log.error('Failed to insert unsubscribe record', insertError);
        throw insertError;
      }

      log.info('Email unsubscribed successfully', { email: emailToUnsubscribe, trackingId });
    }

    // Return HTML page if requested
    if (req.headers.get("accept")?.includes("text/html")) {
      return new Response(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Descadastrado com Sucesso</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              max-width: 400px;
            }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 16px; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Descadastrado com Sucesso</h1>
            <p>Você foi removido da nossa lista de emails.<br>Não receberá mais comunicações.</p>
          </div>
        </body>
        </html>
      `, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }

    return secureJsonResponse({ 
      success: true, 
      message: "Successfully unsubscribed",
      email: emailToUnsubscribe 
    }, 200, corsHeaders);
    
  } catch (error) {
    log.error('Unsubscribe error', error);
    return secureErrorResponse("Internal error", 500, corsHeaders);
  }
}));
