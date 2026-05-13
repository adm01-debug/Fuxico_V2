// ============================================================================
// SECURITY: Esta função é pública por design (tracking/webhook)
// Rate limiting e validação de origem aplicados via Supabase Edge
// ============================================================================

// =============================================================================
// FUXICO - Webhook Dispatch Edge Function
// Arquivo: supabase/functions/webhook-dispatch/index.ts
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { createLogger } from '../_shared/logger.ts'
import { publicHandler } from '../_shared/security-middleware.ts'
import { isWebhookUrlSafe } from '../_shared/url-validator.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { SafeMetadataSchema } from '../_shared/schemas.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const WebhookDispatchSchema = z.object({
  userId: z.string().uuid(),
  eventType: z.enum(['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked']),
  payload: SafeMetadataSchema,
})

// =============================================================================
// RETRY LOGIC
// =============================================================================

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000 // 1 segundo
const MAX_DELAY_MS = 10000 // 10 segundos

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: MAX_RETRIES,
  initialDelay: INITIAL_DELAY_MS,
  maxDelay: MAX_DELAY_MS,
  backoffMultiplier: 2,
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1)
  // Adicionar jitter (±10%) para evitar thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1)
  return Math.min(delay + jitter, config.maxDelay)
}

function isRetryableError(status: number): boolean {
  // Retry em erros de servidor (5xx) e alguns erros de cliente específicos
  return status >= 500 || status === 408 || status === 429
}

async function dispatchWithRetry(
  url: string,
  payload: unknown,
  headers: Record<string, string>,
  config: RetryConfig = defaultRetryConfig,
  log: ReturnType<typeof createLogger>
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null
  let lastResponse: Response | null = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      log.debug(`Webhook dispatch attempt ${attempt}/${config.maxRetries}`, { url })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      lastResponse = response

      // Se sucesso ou erro não-retryable, retornar
      if (response.ok || !isRetryableError(response.status)) {
        return { response, attempts: attempt }
      }

      // Log do erro antes do retry
      log.warn(`Webhook dispatch failed, will retry`, {
        attempt,
        status: response.status,
        statusText: response.statusText,
      })

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Se é o último attempt, não precisamos esperar
      if (attempt === config.maxRetries) {
        log.error(`Webhook dispatch failed after ${attempt} attempts`, lastError)
        break
      }

      log.warn(`Webhook dispatch error, will retry`, {
        attempt,
        error: lastError.message,
      })
    }

    // Aguardar antes do próximo retry (exceto se for o último attempt)
    if (attempt < config.maxRetries) {
      const delay = calculateDelay(attempt, config)
      log.debug(`Waiting ${delay}ms before retry`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Se chegou aqui, falhou após todas as tentativas
  if (lastResponse) {
    return { response: lastResponse, attempts: config.maxRetries }
  }

  // Se não temos response, criar uma artificial de erro
  const errorResponse = new Response(
    JSON.stringify({ error: lastError?.message || 'Max retries exceeded' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  )
  
  return { response: errorResponse, attempts: config.maxRetries }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(publicHandler(async (req, corsHeaders) => {
  const log = createLogger('webhook-dispatch')
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  // Rate limiting
  const rateLimitResult = await checkRateLimit(clientIP, 'webhook-dispatch', 60, 100)
  if (!rateLimitResult.allowed) {
    log.warn('Rate limit exceeded', { ip: clientIP })
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse e validar body
    const body = await req.json().catch(() => ({}))
    const validation = WebhookDispatchSchema.safeParse(body)
    
    if (!validation.success) {
      log.warn('Invalid request payload', { errors: validation.error.issues })
      return secureJsonResponse(
        { error: 'Invalid request', details: validation.error.issues },
        400,
        corsHeaders
      )
    }

    const { userId, eventType, payload } = validation.data
    log.info('Processing webhook dispatch', { userId, eventType })

    // Buscar configuração de webhook do usuário
    const { data: config, error: configError } = await supabaseAdmin
      .from('webhook_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (configError || !config) {
      log.debug('No active webhook configuration found', { userId })
      return secureJsonResponse(
        { skipped: true, reason: 'No active webhook configuration' },
        200,
        corsHeaders
      )
    }

    // Validate webhook URL to prevent SSRF
    if (!isWebhookUrlSafe(config.url)) {
      log.warn('Webhook URL blocked by SSRF protection', { userId, url: config.url })
      return secureJsonResponse(
        { error: 'Webhook URL is not allowed (private/internal addresses are blocked)' },
        400,
        corsHeaders
      )
    }

    // Verificar se o evento está habilitado
    if (!config.events?.includes(eventType)) {
      log.debug('Event type not enabled for webhook', { userId, eventType })
      return secureJsonResponse(
        { skipped: true, reason: 'Event type not enabled' },
        200,
        corsHeaders
      )
    }

    // Preparar payload do webhook
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
      metadata: {
        source: 'fuxico',
        version: '1.0',
      }
    }

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FUXICO-Webhook/1.0',
      'X-Webhook-Event': eventType,
    }

    // Adicionar assinatura HMAC se secret configurado
    if (config.secret) {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(config.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      
      const payloadBytes = encoder.encode(JSON.stringify(webhookPayload))
      const signature = await crypto.subtle.sign('HMAC', key, payloadBytes)
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      
      headers['X-Webhook-Signature'] = `sha256=${signatureHex}`
    }

    // Dispatch com retry
    const startTime = performance.now()
    const { response, attempts } = await dispatchWithRetry(
      config.url,
      webhookPayload,
      headers,
      defaultRetryConfig,
      log
    )
    const duration = performance.now() - startTime

    // Ler response body para log
    const responseBody = await response.text().catch(() => null)

    // Log do resultado
    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: config.id,
      user_id: userId,
      event_type: eventType,
      url: config.url,
      status_code: response.status,
      success: response.ok,
      attempts,
      duration_ms: Math.round(duration),
      request_payload: webhookPayload,
      response_body: responseBody?.substring(0, 1000), // Limitar tamanho
      error: response.ok ? null : responseBody,
    })

    log.info('Webhook dispatch completed', {
      success: response.ok,
      status: response.status,
      attempts,
      duration: Math.round(duration),
    })

    return secureJsonResponse({
      success: response.ok,
      statusCode: response.status,
      attempts,
      duration: Math.round(duration),
    }, 200, corsHeaders)

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    log.error('Webhook dispatch failed', error)
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})
