import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const TrackDocumentSchema = z.object({
  d: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).max(10000).optional().default(1),
  event: z.enum(['view', 'download', 'print', 'scroll']).optional().default('view')
}).refine(data => data.d || data.documentId, { message: 'documentId is required' })

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'track-document', 60, 300)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const params = {
      d: url.searchParams.get('d'),
      documentId: url.searchParams.get('documentId'),
      page: url.searchParams.get('page'),
      event: url.searchParams.get('event')
    }

    const validation = TrackDocumentSchema.safeParse(params)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
    }

    const documentId = validation.data.d || validation.data.documentId
    const { page, event } = validation.data
    const userAgent = req.headers.get('user-agent') || ''

    const { error } = await supabaseAdmin
      .from('document_events')
      .insert({
        document_id: documentId,
        event_type: event,
        page_number: page,
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: { referer: req.headers.get('referer'), timestamp: new Date().toISOString() }
      })

    if (error) throw error
    return secureJsonResponse({ success: true }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
