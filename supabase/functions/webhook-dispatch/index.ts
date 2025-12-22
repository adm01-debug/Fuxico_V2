import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const webhookSchema = z.object({ userId: z.string().uuid(), eventType: z.string(), payload: z.record(z.any()) })

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(ip, 'webhook-dispatch', 100, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const body = await req.json()
    const validation = webhookSchema.safeParse(body)
    if (!validation.success) return secureJsonResponse({ error: 'Invalid input' }, 400, corsHeaders)

    const { userId, eventType, payload } = validation.data
    const { data: config } = await supabaseAdmin.from('webhook_configs').select('*').eq('user_id', userId).eq('is_active', true).single()
    if (!config) return secureJsonResponse({ skipped: true }, 200, corsHeaders)

    const response = await fetch(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: eventType, data: payload }) })
    await supabaseAdmin.from('webhook_logs').insert({ webhook_id: config.id, user_id: userId, event_type: eventType, status_code: response.status, success: response.ok })

    return secureJsonResponse({ success: response.ok }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
