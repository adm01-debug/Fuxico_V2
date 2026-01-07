// =============================================================================
// FUXICO - Security Edge Function: Rate Limiting
// File: supabase/functions/check-rate-limit/index.ts
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

interface RateLimitRequest {
  endpoint: string;
  maxRequests?: number;
  windowSeconds?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blocked: boolean;
  whitelisted: boolean;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Self rate limiting - prevent abuse of the rate limit checker itself
  const selfIP = req.headers.get('cf-connecting-ip') || 
                 req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 'unknown';
  
  const selfRateLimit = await checkRateLimit(selfIP, {
    windowMs: 60000,
    maxRequests: 100,
    keyPrefix: "check-rate-limit:"
  });

  if (!selfRateLimit.allowed) {
    const retryAfter = Math.ceil((selfRateLimit.resetAt - Date.now()) / 1000);
    return new Response(JSON.stringify({
      error: "Too many requests to rate limit checker",
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client IP
    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               'unknown';

    const { endpoint, maxRequests = 60, windowSeconds = 60 }: RateLimitRequest = await req.json();

    // Check if IP is whitelisted
    const { data: whitelisted } = await supabase.rpc('is_ip_whitelisted', { _ip_address: ip });
    
    if (whitelisted) {
      return new Response(JSON.stringify({
        allowed: true,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowSeconds * 1000).toISOString(),
        blocked: false,
        whitelisted: true,
      } as RateLimitResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if IP is blocked
    const { data: blocked } = await supabase.rpc('is_ip_blocked', { _ip_address: ip });
    
    if (blocked) {
      // Log the blocked attempt
      await supabase.from('rate_limit_logs').insert({
        ip_address: ip,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
        window_end: new Date(Date.now() + windowSeconds * 1000).toISOString(),
        is_blocked: true,
        user_agent: req.headers.get('user-agent'),
      });

      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        blocked: true,
        whitelisted: false,
      } as RateLimitResult), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '3600',
        },
      });
    }

    // Check rate limit
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, maxRequests - entry.count);
    const allowed = entry.count <= maxRequests;

    // Log if blocked
    if (!allowed) {
      await supabase.from('rate_limit_logs').insert({
        ip_address: ip,
        endpoint,
        request_count: entry.count,
        window_start: new Date(entry.resetAt - windowMs).toISOString(),
        window_end: new Date(entry.resetAt).toISOString(),
        is_blocked: true,
        user_agent: req.headers.get('user-agent'),
      });

      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: null,
        _event_type: 'rate_limit',
        _severity: 'warning',
        _description: `Rate limit exceeded for ${endpoint} from ${ip}`,
        _ip_address: ip,
        _user_agent: req.headers.get('user-agent'),
      });
    }

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetAt: new Date(entry.resetAt).toISOString(),
      blocked: false,
      whitelisted: false,
    };

    return new Response(JSON.stringify(result), {
      status: allowed ? 200 : 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        ...(allowed ? {} : { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) }),
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
