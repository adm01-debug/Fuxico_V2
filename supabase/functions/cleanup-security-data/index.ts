// =============================================================================
// FUXICO - Security Edge Function: Cleanup Expired Data
// File: supabase/functions/cleanup-security-data/index.ts
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting - this is an admin function, limit to 10/minute
  const clientIP = req.headers.get('cf-connecting-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   'unknown';
  
  const rateLimitResult = await checkRateLimit(clientIP, {
    windowMs: 60000,
    maxRequests: 10,
    keyPrefix: "cleanup-security:"
  });

  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({
      error: "Too many cleanup requests",
      retryAfter: rateLimitResult.retryAfter
    }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(rateLimitResult.retryAfter || 60)
      },
    });
  }

  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
