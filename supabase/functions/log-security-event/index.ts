// =============================================================================
// FUXICO - Security Edge Function: Log Security Event
// File: supabase/functions/log-security-event/index.ts
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityEventRequest {
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'success';
  description: string;
  metadata?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get client info
    const ip = req.headers.get('cf-connecting-ip') ||
               req.headers.get('x-real-ip') ||
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               null;
    
    const userAgent = req.headers.get('user-agent');

    const { event_type, severity, description, metadata }: SecurityEventRequest = await req.json();

    // Validate input
    if (!event_type || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the event
    const { data: eventId, error } = await supabase.rpc('log_security_event', {
      _user_id: userId,
      _event_type: event_type,
      _severity: severity || 'info',
      _description: description,
      _ip_address: ip,
      _user_agent: userAgent,
      _metadata: metadata || {},
    });

    if (error) throw error;

    // For critical events, we could send notifications here
    if (severity === 'critical' || severity === 'error') {
      console.log(`[SECURITY ALERT] ${severity.toUpperCase()}: ${description}`);
      // TODO: Send email/webhook notification for critical events
    }

    return new Response(JSON.stringify({ 
      success: true, 
      event_id: eventId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Security event error:', errorMessage);

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
