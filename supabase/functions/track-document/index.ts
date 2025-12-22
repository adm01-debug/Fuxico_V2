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

    const url = new URL(req.url)
    const documentId = url.searchParams.get('d') || url.searchParams.get('documentId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const eventType = url.searchParams.get('event') || 'view'

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get client info
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    // Log document event
    const { error } = await supabaseAdmin
      .from('document_events')
      .insert({
        document_id: documentId,
        event_type: eventType,
        page_number: page,
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          referer: req.headers.get('referer'),
          timestamp: new Date().toISOString()
        }
      })

    if (error) throw error

    // Update document stats
    await supabaseAdmin
      .from('tracked_documents')
      .update({ 
        view_count: supabaseAdmin.rpc('increment_view_count', { doc_id: documentId }),
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
