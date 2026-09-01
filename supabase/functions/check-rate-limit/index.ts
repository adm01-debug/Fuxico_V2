// =============================================================================
// FUXICO - Security Edge Function: Rate Limiting
// File: supabase/functions/check-rate-limit/index.ts
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts";
import { protectedHandler } from "../_shared/security-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RateLimitRequestSchema = z.object({
  endpoint: z.string().min(1),
  maxRequests: z.number().min(1).default(60),
  windowSeconds: z.number().min(1).default(60),
});

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  blocked: boolean;
  whitelisted: boolean;
}

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

Deno.serve(protectedHandler(async (req: Request, corsHeaders: Record<string, string>): Promise<Response> => {
  // Self rate limiting - prevent abuse of the rate limit checker itself
  const selfIP = getClientIP(req.headers);

  
  const selfRateLimit = await checkRateLimit(selfIP, 'check-rate-limit', 100, 60);

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
    const ip = getClientIP(req.headers);

    const body = await req.json();
    const validation = RateLimitRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid parameters', details: validation.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { endpoint, maxRequests, windowSeconds } = validation.data;

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

  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));
