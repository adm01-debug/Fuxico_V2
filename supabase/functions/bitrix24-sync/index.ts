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

  const rateLimitResult = await checkRateLimit(ip, 'bitrix24-sync', 20, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const body = await req.json()
    const { action, data } = body

    const { data: prefs } = await supabaseClient
      .from('user_preferences')
      .select('bitrix24_webhook_url, bitrix24_user_id')
      .eq('user_id', user.id)
      .single()

    if (!prefs?.bitrix24_webhook_url) {
      return secureJsonResponse({ error: 'Bitrix24 not configured' }, 400, corsHeaders)
    }

    let result
    switch (action) {
      case 'sync_contact':
        result = await syncContact(prefs.bitrix24_webhook_url, data)
        break
      case 'create_deal':
        result = await createDeal(prefs.bitrix24_webhook_url, data)
        break
      case 'register_activity':
        result = await registerActivity(prefs.bitrix24_webhook_url, data)
        break
      default:
        return secureJsonResponse({ error: 'Invalid action' }, 400, corsHeaders)
    }

    await supabaseClient.from('bitrix24_sync_logs').insert({
      user_id: user.id, action, success: true, response: result
    })

    return secureJsonResponse({ success: true, result }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})

async function syncContact(webhookUrl: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.contact.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { NAME: data.name, EMAIL: [{ VALUE: data.email, VALUE_TYPE: 'WORK' }] } })
  })
  return response.json()
}

async function createDeal(webhookUrl: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.deal.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { TITLE: data.title, OPPORTUNITY: data.value, CONTACT_ID: data.contactId } })
  })
  return response.json()
}

async function registerActivity(webhookUrl: string, data: any) {
  const response = await fetch(`${webhookUrl}/crm.activity.add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { SUBJECT: data.subject, DESCRIPTION: data.description, OWNER_TYPE_ID: 3, OWNER_ID: data.contactId, TYPE_ID: 4, COMPLETED: 'Y' } })
  })
  return response.json()
}
