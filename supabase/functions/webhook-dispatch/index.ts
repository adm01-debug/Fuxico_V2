// =============================================================================
// FUXICO - Edge Function: webhook-dispatch
// Dispara webhooks para sistemas externos (n8n, Zapier, Make, etc.)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// TIPOS
// =============================================================================

interface WebhookPayload {
  event_type: 'email_open' | 'link_click' | 'bounce' | 'document_view' | 'document_download'
  timestamp: string
  tracking_id?: string
  user_id: string
  data: Record<string, unknown>
}

interface WebhookConfig {
  id: string
  url: string
  secret: string | null
  events: string[]
  is_active: boolean
  user_id: string
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return `sha256=${hmac.digest('hex')}`
}

async function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string | null,
  timeout: number = 10000,
  maxRetries: number = 3
): Promise<{ success: boolean; statusCode?: number; responseBody?: string; error?: string }> {
  const body = JSON.stringify(payload)
  const deliveryId = crypto.randomUUID()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'FUXICO-Webhook/2.0',
    'X-Webhook-Event': payload.event_type,
    'X-Webhook-Delivery': deliveryId,
    'X-Webhook-Timestamp': payload.timestamp,
  }
  
  if (secret) {
    headers['X-Webhook-Secret'] = secret
    headers['X-Webhook-Signature'] = generateSignature(body, secret)
  }
  
  let lastError: string | undefined
  let lastStatusCode: number | undefined
  let lastResponseBody: string | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[Webhook] Tentativa ${attempt + 1}/${maxRetries} para ${url}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      lastStatusCode = response.status
      lastResponseBody = await response.text()
      
      if (response.ok) {
        console.log(`[Webhook] Sucesso: ${response.status}`)
        return { 
          success: true, 
          statusCode: response.status,
          responseBody: lastResponseBody,
        }
      }
      
      lastError = `HTTP ${response.status}: ${lastResponseBody}`
      console.warn(`[Webhook] Falha: ${lastError}`)
      
      // Não retry para erros 4xx (exceto 429 - rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { 
          success: false, 
          statusCode: response.status, 
          responseBody: lastResponseBody,
          error: lastError,
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = 'Request timeout'
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error'
      }
      console.error(`[Webhook] Erro: ${lastError}`)
    }
    
    // Backoff exponencial entre retries
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000
      console.log(`[Webhook] Aguardando ${delay}ms antes do próximo retry`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  
  return { 
    success: false, 
    statusCode: lastStatusCode,
    responseBody: lastResponseBody,
    error: lastError,
  }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const payload = await req.json() as WebhookPayload
    
    // Validar payload
    if (!payload.event_type || !payload.user_id) {
      console.error('[Webhook] Payload inválido:', payload)
      return new Response(JSON.stringify({ error: 'Invalid payload: event_type and user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[Webhook] Processando evento: ${payload.event_type} para user ${payload.user_id}`)

    // Buscar configuração de webhook do usuário
    const { data: webhookConfig, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', payload.user_id)
      .eq('is_active', true)
      .maybeSingle()

    if (configError) {
      console.error('[Webhook] Erro ao buscar config:', configError)
      return new Response(JSON.stringify({ error: 'Failed to fetch webhook config' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!webhookConfig) {
      console.log('[Webhook] Nenhuma configuração ativa encontrada')
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No active webhook configuration found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar se o evento está habilitado
    if (!webhookConfig.events.includes(payload.event_type)) {
      console.log(`[Webhook] Evento ${payload.event_type} não está habilitado`)
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Event ${payload.event_type} not enabled` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enriquecer payload
    const enrichedPayload: WebhookPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
      data: {
        ...payload.data,
        source: 'fuxico',
        version: '2.0.0',
      },
    }

    // Enviar webhook
    const result = await sendWebhook(
      webhookConfig.url,
      enrichedPayload,
      webhookConfig.secret,
    )

    // Registrar log
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        user_id: payload.user_id,
        webhook_id: webhookConfig.id,
        event_type: payload.event_type,
        tracking_id: payload.tracking_id || null,
        payload: enrichedPayload,
        success: result.success,
        response_status: result.statusCode || null,
        response_body: result.responseBody || null,
        error: result.error || null,
      })

    if (logError) {
      console.error('[Webhook] Erro ao salvar log:', logError)
    }

    console.log(`[Webhook] Resultado: ${result.success ? 'sucesso' : 'falha'}`)

    return new Response(JSON.stringify({
      success: result.success,
      statusCode: result.statusCode,
      error: result.error,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[Webhook] Erro inesperado:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
