// FUXICO - Edge Function para Webhooks Externos
// Dispara eventos para n8n, Zapier, Make, ou qualquer endpoint configurado

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// TIPOS
// ============================================

interface WebhookConfig {
  enabled: boolean
  url: string | null
  secret: string | null
  events: string[]
  retries: number
  timeout: number
}

interface WebhookEvent {
  event_type: 'email_open' | 'link_click' | 'document_view' | 'bounce_detected' | 'tracking_created'
  timestamp: string
  tracking_id: string
  user_id: string
  data: Record<string, unknown>
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

async function sendWebhook(
  url: string, 
  event: WebhookEvent, 
  secret: string | null,
  timeout: number = 10000,
  retries: number = 3
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payload = JSON.stringify(event)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'FUXICO-Webhook/1.0',
    'X-FUXICO-Event': event.event_type,
    'X-FUXICO-Delivery': crypto.randomUUID(),
    'X-FUXICO-Timestamp': event.timestamp,
  }
  
  // Adicionar assinatura se tiver secret
  if (secret) {
    headers['X-FUXICO-Signature'] = generateSignature(payload, secret)
  }
  
  let lastError: string | undefined
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return { success: true, statusCode: response.status }
      }
      
      lastError = `HTTP ${response.status}: ${await response.text()}`
      
      // Não retry para erros 4xx (exceto 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { success: false, statusCode: response.status, error: lastError }
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      // Se abortou por timeout, conta como falha
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = 'Request timeout'
      }
    }
    
    // Backoff exponencial entre retries
    if (attempt < retries - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
    }
  }
  
  return { success: false, error: lastError }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json() as WebhookEvent
    
    // Validar evento
    if (!body.event_type || !body.tracking_id || !body.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid event payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[Webhook] Processando evento: ${body.event_type} para user ${body.user_id}`)

    // Buscar configuração de webhook do usuário
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('webhook_config')
      .eq('user_id', body.user_id)
      .maybeSingle()

    const webhookConfig = userPrefs?.webhook_config as WebhookConfig | null

    if (!webhookConfig?.enabled || !webhookConfig?.url) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Webhook not configured or disabled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar se o evento está na lista de eventos habilitados
    if (!webhookConfig.events.includes(body.event_type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Event ${body.event_type} not enabled for webhook` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enriquecer dados do evento
    const enrichedEvent: WebhookEvent = {
      ...body,
      timestamp: body.timestamp || new Date().toISOString(),
      data: {
        ...body.data,
        source: 'fuxico',
        version: '1.1.0',
      },
    }

    // Enviar webhook
    const result = await sendWebhook(
      webhookConfig.url,
      enrichedEvent,
      webhookConfig.secret,
      webhookConfig.timeout || 10000,
      webhookConfig.retries || 3
    )

    // Registrar log do webhook (ignore errors silently since webhook_logs table might not exist)
    try {
      await supabase.from('webhook_logs').insert({
        user_id: body.user_id,
        event_type: body.event_type,
        tracking_id: body.tracking_id,
        webhook_url: webhookConfig.url,
        success: result.success,
        status_code: result.statusCode,
        error_message: result.error,
        request_payload: enrichedEvent,
      })
    } catch (logError) {
      console.error('Erro ao salvar log de webhook:', logError)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in webhook-dispatch function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
