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

// Time threshold for self-open detection (2 minutes in milliseconds)
const SELF_OPEN_THRESHOLD_MS = 2 * 60 * 1000

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

    // Get the tracked email to check creation time
    const { data: trackedEmail, error: emailError } = await supabase
      .from('tracked_emails')
      .select('created_at, sender_email, user_id')
      .eq('tracking_id', trackingId)
      .maybeSingle()

    if (emailError) {
      console.error('Error fetching tracked email:', emailError)
    }

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || null

    // Detect self-open based on timing
    let isSelfOpen = false
    if (trackedEmail?.created_at) {
      const emailCreatedAt = new Date(trackedEmail.created_at).getTime()
      const now = Date.now()
      const timeSinceCreation = now - emailCreatedAt
      
      // If opened within 2 minutes of creation, likely a self-open
      if (timeSinceCreation < SELF_OPEN_THRESHOLD_MS) {
        isSelfOpen = true
        console.log(`Detected self-open for tracking ID: ${trackingId} (opened ${timeSinceCreation}ms after creation)`)
      }
    }

    // Log the open event
    const { error } = await supabase
      .from('tracking_events')
      .insert({
        tracking_id: trackingId,
        event_type: 'open',
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        is_self_open: isSelfOpen,
        metadata: {
          timestamp: new Date().toISOString(),
          time_since_creation_ms: trackedEmail?.created_at 
            ? Date.now() - new Date(trackedEmail.created_at).getTime() 
            : null,
          headers: {
            accept: req.headers.get('accept'),
            acceptLanguage: req.headers.get('accept-language'),
          }
        }
      })

    if (error) {
      console.error('Error logging tracking event:', error)
    } else {
      console.log(`Successfully logged ${isSelfOpen ? 'self-' : ''}open event for tracking ID: ${trackingId}`)
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