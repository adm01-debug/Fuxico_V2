// =============================================================================
// FUXICO - Security Edge Function: Log Security Event
// File: supabase/functions/log-security-event/index.ts
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

interface SecurityEventRequest {
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'success';
  description: string;
  metadata?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('cf-connecting-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   'unknown';

  const rateLimitResult = await checkRateLimit(clientIP, {
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: "log-security:"
  });

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return new Response(JSON.stringify({
      error: "Too many requests",
      retryAfter
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const userAgent = req.headers.get('user-agent');
    const { event_type, severity, description, metadata }: SecurityEventRequest = await req.json();

    if (!event_type || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: eventId, error } = await supabase.rpc('log_security_event', {
      _user_id: userId,
      _event_type: event_type,
      _severity: severity || 'info',
      _description: description,
      _ip_address: clientIP,
      _user_agent: userAgent,
      _metadata: metadata || {},
    });

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true, 
      event_id: eventId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
