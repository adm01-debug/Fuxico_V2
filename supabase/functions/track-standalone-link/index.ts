import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const linkId = url.searchParams.get('id')

    if (!linkId) {
      return new Response('Missing link ID', { status: 400, headers: corsHeaders })
    }

    // Get link data
    const { data: link } = await supabaseAdmin
      .from('tracked_links')
      .select('*')
      .eq('id', linkId)
      .single()

    if (!link) {
      return new Response('Link not found', { status: 404, headers: corsHeaders })
    }

    // Log click
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    await supabaseAdmin.from('tracking_events').insert({
      tracking_id: link.tracking_id,
      event_type: 'click',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { standalone_link_id: linkId }
    })

    // Redirect
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': link.original_url }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
