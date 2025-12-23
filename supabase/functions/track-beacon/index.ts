import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for beacon/fetch tracking
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    let trackingId: string | null = null
    let method = 'beacon'

    // Support both GET (url param) and POST (body)
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      trackingId = body.t || body.trackingId
      method = body.method || 'beacon'
    } else {
      const url = new URL(req.url)
      trackingId = url.searchParams.get('t')
      method = url.searchParams.get('m') || 'redirect'
    }

    if (!trackingId) {
      return new Response(JSON.stringify({ ok: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Get email info to check for self-opens
    const { data: email } = await supabaseAdmin
      .from('tracked_emails')
      .select('user_id')
      .eq('tracking_id', trackingId)
      .single()

    let isSelfOpen = false
    if (email) {
      const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('self_ip_addresses')
        .eq('user_id', email.user_id)
        .single()
      
      if (prefs?.self_ip_addresses?.includes(clientIP)) {
        isSelfOpen = true
      }
    }

    // Register the tracking event with fallback method info
    await supabaseAdmin.from('tracking_events').insert({
      tracking_id: trackingId,
      event_type: 'open',
      ip_address: clientIP,
      user_agent: userAgent,
      is_self_open: isSelfOpen,
      metadata: { 
        fallback_method: method,
        referer: req.headers.get('referer'),
        timestamp: new Date().toISOString()
      }
    })

    console.log(`[track-beacon] Registered open via ${method} for ${trackingId}`)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[track-beacon] Error:', error)
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
