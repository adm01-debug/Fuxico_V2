import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1x1 transparent GIF
const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
])

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const trackingId = url.searchParams.get('id')

    if (!trackingId) {
      console.log('No tracking ID provided')
      return new Response(TRANSPARENT_GIF, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    console.log(`Tracking pixel requested for ID: ${trackingId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || null

    // Log the open event
    const { error } = await supabase
      .from('tracking_events')
      .insert({
        tracking_id: trackingId,
        event_type: 'open',
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        metadata: {
          timestamp: new Date().toISOString(),
          headers: {
            accept: req.headers.get('accept'),
            acceptLanguage: req.headers.get('accept-language'),
          }
        }
      })

    if (error) {
      console.error('Error logging tracking event:', error)
    } else {
      console.log(`Successfully logged open event for tracking ID: ${trackingId}`)
    }

    // Return transparent GIF
    return new Response(TRANSPARENT_GIF, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error in track-pixel function:', error)
    return new Response(TRANSPARENT_GIF, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
      },
    })
  }
})
