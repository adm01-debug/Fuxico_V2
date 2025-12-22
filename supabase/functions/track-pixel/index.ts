import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// track-pixel precisa de CORS aberto para funcionar com email clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

// 1x1 transparent GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const trackingId = url.searchParams.get('t')

    if (!trackingId) {
      return new Response(PIXEL, {
        headers: { ...corsHeaders, 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' }
      })
    }

    // Get client info
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    // Check for self-open
    const { data: email } = await supabaseAdmin
      .from('tracked_emails')
      .select('user_id, sender_email')
      .eq('tracking_id', trackingId)
      .single()

    let isSelfOpen = false
    if (email) {
      const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('self_ip_addresses')
        .eq('user_id', email.user_id)
        .single()
      
      if (prefs?.self_ip_addresses?.includes(ip)) {
        isSelfOpen = true
      }
    }

    // Log open event
    await supabaseAdmin.from('tracking_events').insert({
      tracking_id: trackingId,
      event_type: 'open',
      ip_address: ip,
      user_agent: userAgent,
      is_self_open: isSelfOpen,
      metadata: {
        referer: req.headers.get('referer'),
        timestamp: new Date().toISOString()
      }
    })

    return new Response(PIXEL, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    return new Response(PIXEL, {
      headers: { ...corsHeaders, 'Content-Type': 'image/gif' }
    })
  }
})
