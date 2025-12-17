import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const linkId = url.searchParams.get('l')

    if (!linkId) {
      console.log('No link ID provided')
      return new Response('Link not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    console.log(`Link click tracked for link ID: ${linkId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the tracked link
    const { data: link, error: linkError } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('link_id', linkId)
      .maybeSingle()

    if (linkError || !link) {
      console.error('Link not found:', linkError)
      return new Response('Link not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || null

    // Log the click event
    const { error: eventError } = await supabase
      .from('tracking_events')
      .insert({
        tracking_id: link.tracking_id,
        event_type: 'click',
        ip_address: ipAddress,
        user_agent: userAgent,
        referer: referer,
        link_url: link.original_url,
        metadata: {
          link_id: linkId,
          timestamp: new Date().toISOString(),
        }
      })

    if (eventError) {
      console.error('Error logging click event:', eventError)
    }

    // Update click count
    await supabase
      .from('tracked_links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id)

    console.log(`Redirecting to: ${link.original_url}`)

    // Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.original_url,
        'Cache-Control': 'no-store, no-cache',
      },
    })
  } catch (error) {
    console.error('Error in track-link function:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
