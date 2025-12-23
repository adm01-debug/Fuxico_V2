import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const bounceSchema = z.object({ trackingId: z.string().uuid(), bounceType: z.string().optional(), bounceReason: z.string().optional() })

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'report-bounce', 50, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const body = await req.json()
    const validation = bounceSchema.safeParse(body)
    if (!validation.success) return secureJsonResponse({ error: 'Invalid input' }, 400, corsHeaders)

    const { trackingId, bounceType, bounceReason } = validation.data
    const { data, error } = await supabaseAdmin.from('tracked_emails').update({ delivery_status: 'bounced', bounce_type: bounceType || 'unknown', bounce_reason: bounceReason || '', bounce_detected_at: new Date().toISOString() }).eq('tracking_id', trackingId).select().single()
    if (error) throw error

    return secureJsonResponse({ success: true, email: data }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})
