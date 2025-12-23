import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'track-document', 200, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const url = new URL(req.url)
    const documentId = url.searchParams.get('d')
    if (!documentId) return secureJsonResponse({ error: 'documentId required' }, 400, corsHeaders)

    const page = parseInt(url.searchParams.get('page') || '1')
    const eventType = url.searchParams.get('event') || 'view'
    const userAgent = req.headers.get('user-agent') || ''

    await supabaseAdmin.from('document_events').insert({ document_id: documentId, event_type: eventType, page_number: page, ip_address: ip, user_agent: userAgent, metadata: { timestamp: new Date().toISOString() } })

    return secureJsonResponse({ success: true }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})
