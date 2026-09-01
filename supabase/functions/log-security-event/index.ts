// =============================================================================
// FUXICO - Security Edge Function: Log Security Event
// File: supabase/functions/log-security-event/index.ts
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP } from "../_shared/rate-limit.ts";
import { protectedHandler } from "../_shared/security-middleware.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SecurityEventSchema = z.object({
  event_type: z.string().min(1),
  severity: z.enum(['info', 'warning', 'error', 'critical', 'success']).default('info'),
  description: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

Deno.serve(protectedHandler(async (req: Request, corsHeaders: Record<string, string>): Promise<Response> => {
  const clientIP = getClientIP(req.headers);

  const rateLimitResult = await checkRateLimit(clientIP, 'log-security', 30, 60);


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
    const body = await req.json();
    const validation = SecurityEventSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validation.error.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event_type, severity, description, metadata } = validation.data;

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

  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));
