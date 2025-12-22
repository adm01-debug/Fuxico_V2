import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const WebhookDispatchSchema = z.object({
  userId: z.string().uuid(),
  eventType: z.enum(['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked']),
  payload: z.record(z.any()).optional().default({})
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'webhook-dispatch', 60, 100)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const validation = WebhookDispatchSchema.safeParse(body)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
    }

    const { userId, eventType, payload } = validation.data

    const { data: config } = await supabaseAdmin
      .from('webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!config || !config.events?.includes(eventType)) {
      return secureJsonResponse({ skipped: true, reason: 'No active webhook for this event' }, 200, corsHeaders)
    }

    const webhookPayload = { event: eventType, timestamp: new Date().toISOString(), data: payload }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }

    if (config.secret) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey('raw', encoder.encode(config.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(webhookPayload)))
      headers['X-Webhook-Signature'] = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
    }

    const response = await fetch(config.url, { method: 'POST', headers, body: JSON.stringify(webhookPayload) })

    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: config.id, user_id: userId, event_type: eventType,
      status_code: response.status, success: response.ok,
      response_body: await response.text().catch(() => null)
    })

    return secureJsonResponse({ success: response.ok, statusCode: response.status }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
