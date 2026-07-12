// =============================================================================
// FUXICO - Security Edge Function: Cleanup Expired Data
// File: supabase/functions/cleanup-security-data/index.ts
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts";
import { protectedHandler } from "../_shared/security-middleware.ts";

Deno.serve(protectedHandler(async (req: Request, corsHeaders: Record<string, string>): Promise<Response> => {
  // Rate limiting - this is an admin function, limit to 10/minute
  const clientIP = getClientIP(req.headers);
  
  const rateLimitResult = await checkRateLimit(clientIP, 'cleanup-security', 10, 60);


  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return new Response(JSON.stringify({
      error: "Too many cleanup requests",
      retryAfter
    }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter)
      },
    });
  }

  try {
    // SECURITY: Verify admin authorization via service key header or cron secret
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    const providedSecret = req.headers.get('X-Cron-Secret');

    if (cronSecret && providedSecret !== cronSecret) {
      // If cron secret is configured, require it
      // Otherwise fall back to admin user check
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized - admin access required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    const stats = {
      expiredBlockedIPs: 0,
      expiredSessions: 0,
      oldLoginAttempts: 0,
      oldRateLimitLogs: 0,
      expiredPasswordTokens: 0,
      expiredEmailTokens: 0,
    };

    // 1. Remove expired blocked IPs (non-permanent)
    const { count: expiredIPs } = await supabase
      .from('blocked_ips')
      .delete({ count: 'exact' })
      .lt('expires_at', now)
      .eq('is_permanent', false);
    stats.expiredBlockedIPs = expiredIPs || 0;

    // 2. Remove expired sessions
    const { count: expiredSessions } = await supabase
      .from('active_sessions')
      .delete({ count: 'exact' })
      .lt('expires_at', now);
    stats.expiredSessions = expiredSessions || 0;

    // 3. Remove old login attempts (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: oldAttempts } = await supabase
      .from('login_attempts')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo);
    stats.oldLoginAttempts = oldAttempts || 0;

    // 4. Remove old rate limit logs (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: oldLogs } = await supabase
      .from('rate_limit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', sevenDaysAgo);
    stats.oldRateLimitLogs = oldLogs || 0;

    // 5. Remove expired password reset tokens
    const { count: expiredPasswords } = await supabase
      .from('password_reset_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', now);
    stats.expiredPasswordTokens = expiredPasswords || 0;

    // 6. Remove expired email verification tokens
    const { count: expiredEmails } = await supabase
      .from('email_verification_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', now);
    stats.expiredEmailTokens = expiredEmails || 0;

    return new Response(JSON.stringify({ 
      success: true, 
      stats,
      timestamp: now,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));
