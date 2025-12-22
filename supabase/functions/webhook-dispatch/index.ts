import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, eventType, payload } = await req.json()

    if (!userId || !eventType) {
      return new Response(JSON.stringify({ error: 'userId and eventType required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's webhook config
    const { data: config } = await supabaseAdmin
      .from('webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!config || !config.events.includes(eventType)) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No active webhook for this event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    }

    // Create signature if secret exists
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.secret) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(config.secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(webhookPayload)))
      headers['X-Webhook-Signature'] = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Send webhook
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookPayload)
    })

    // Log result
    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: config.id,
      user_id: userId,
      event_type: eventType,
      status_code: response.status,
      success: response.ok,
      response_body: await response.text().catch(() => null)
    })

    return new Response(JSON.stringify({ success: response.ok, statusCode: response.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
