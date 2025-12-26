import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateIPAccess } from '../_shared/ip-whitelist.ts';
import { createLogger } from '../_shared/logger.ts'

const log = createLogger('bitrix24-sync')
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const Bitrix24SyncSchema = z.object({
  action: z.enum(['sync_contact', 'create_deal', 'register_activity', 'sync_email_event']),
  email: z.string().email().optional(),
  trackingId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  data: z.record(z.any()).optional().default({})
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'bitrix24-sync', 60, 60)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const body = await req.json().catch(() => ({}))
    const validation = Bitrix24SyncSchema.safeParse(body)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
    }

    const { action, email, trackingId, eventType, data } = validation.data

    // Buscar config Bitrix24 do usuário
    const { data: prefs } = await supabaseClient
      .from('user_preferences')
      .select('bitrix24_webhook_url, bitrix24_user_id')
      .eq('user_id', user.id)
      .single()

    if (!prefs?.bitrix24_webhook_url) {
      return secureJsonResponse({ error: 'Bitrix24 not configured' }, 400, corsHeaders)
    }

    let result: any = { success: false }

    switch (action) {
      case 'sync_contact':
        if (email) {
          result = await syncContact(prefs.bitrix24_webhook_url, email, data)
        }
        break
      case 'create_deal':
        result = await createDeal(prefs.bitrix24_webhook_url, data)
        break
      case 'register_activity':
        result = await registerActivity(prefs.bitrix24_webhook_url, data)
        break
      case 'sync_email_event':
        if (trackingId && eventType) {
          result = await syncEmailEvent(prefs.bitrix24_webhook_url, trackingId, eventType, data)
        }
        break
    }

    // Log sync
    await supabaseClient.from('bitrix24_sync_logs').insert({
      user_id: user.id,
      action,
      success: result.success,
      metadata: { email, trackingId, eventType, result }
    })

    return secureJsonResponse(result, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})

async function syncContact(webhookUrl: string, email: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.contact.list?filter[EMAIL]=${encodeURIComponent(email)}`)
  const existing = await response.json()
  
  if (existing.result && existing.result.length > 0) {
    return { success: true, action: 'found', contactId: existing.result[0].ID }
  }

  const createResponse = await fetch(`${webhookUrl}/crm.contact.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }], ...data } })
  })
  const created = await createResponse.json()
  return { success: !!created.result, action: 'created', contactId: created.result }
}

async function createDeal(webhookUrl: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.deal.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: data })
  })
  const result = await response.json()
  return { success: !!result.result, dealId: result.result }
}

async function registerActivity(webhookUrl: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.activity.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { ...data, COMPLETED: 'Y' } })
  })
  const result = await response.json()
  return { success: !!result.result, activityId: result.result }
}

async function syncEmailEvent(webhookUrl: string, trackingId: string, eventType: string, data: any) {
  const activityData = {
    SUBJECT: `Email ${eventType}: ${data.subject || 'Sem assunto'}`,
    DESCRIPTION: `Email foi ${eventType} em ${new Date().toISOString()}`,
    TYPE_ID: 4, // Email
    DIRECTION: 2, // Outgoing
    ...data
  }
  return await registerActivity(webhookUrl, activityData)
}
