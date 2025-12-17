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
    const trackingId = url.searchParams.get('id')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // If tracking ID provided, get specific email stats
    if (trackingId) {
      console.log(`Getting stats for tracking ID: ${trackingId}`)

      // Get email details
      const { data: email, error: emailError } = await supabase
        .from('tracked_emails')
        .select('*')
        .eq('tracking_id', trackingId)
        .maybeSingle()

      if (emailError || !email) {
        return new Response(JSON.stringify({ error: 'Tracking ID not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get all events for this email
      const { data: events, error: eventsError } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('tracking_id', trackingId)
        .order('created_at', { ascending: false })

      // Get tracked links
      const { data: links, error: linksError } = await supabase
        .from('tracked_links')
        .select('*')
        .eq('tracking_id', trackingId)

      // Calculate stats
      const openEvents = events?.filter(e => e.event_type === 'open') || []
      const clickEvents = events?.filter(e => e.event_type === 'click') || []
      
      // Get unique opens by IP
      const uniqueOpens = new Set(openEvents.map(e => e.ip_address)).size
      const uniqueClicks = new Set(clickEvents.map(e => e.ip_address)).size

      return new Response(JSON.stringify({
        email,
        stats: {
          totalOpens: openEvents.length,
          uniqueOpens,
          totalClicks: clickEvents.length,
          uniqueClicks,
          firstOpened: openEvents.length > 0 ? openEvents[openEvents.length - 1].created_at : null,
          lastOpened: openEvents.length > 0 ? openEvents[0].created_at : null,
        },
        events: events || [],
        links: links || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all emails with basic stats
    console.log('Getting all tracked emails')

    const { data: emails, error: emailsError } = await supabase
      .from('tracked_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (emailsError) {
      console.error('Error fetching emails:', emailsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get event counts for each email
    const emailsWithStats = await Promise.all(
      (emails || []).map(async (email) => {
        const { data: events } = await supabase
          .from('tracking_events')
          .select('event_type')
          .eq('tracking_id', email.tracking_id)

        const opens = events?.filter(e => e.event_type === 'open').length || 0
        const clicks = events?.filter(e => e.event_type === 'click').length || 0

        return {
          ...email,
          opens,
          clicks,
        }
      })
    )

    return new Response(JSON.stringify({
      emails: emailsWithStats,
      total: emailsWithStats.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-tracking-stats function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
