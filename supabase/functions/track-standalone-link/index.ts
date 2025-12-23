import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'track-standalone-link', 300, 60)
  if (!rateLimitResult.allowed) return new Response('Rate limit', { status: 429, headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const url = new URL(req.url)
    const linkId = url.searchParams.get('id')
    if (!linkId) return new Response('Missing ID', { status: 400, headers: corsHeaders })

    const { data: link } = await supabaseAdmin.from('tracked_links').select('*').eq('id', linkId).single()
    if (!link) return new Response('Not found', { status: 404, headers: corsHeaders })

    await supabaseAdmin.from('tracking_events').insert({ tracking_id: link.tracking_id, event_type: 'click', ip_address: ip, user_agent: req.headers.get('user-agent') || '', metadata: { standalone: true } })

    return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': link.original_url } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(message, { status: 500, headers: corsHeaders })
  }
})
