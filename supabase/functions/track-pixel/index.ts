// =============================================================================
// FUXICO - Edge Function: track-pixel (OTIMIZADA)
// Arquivo: supabase/functions/track-pixel/index.ts
// Descrição: Registra abertura de email via pixel invisível
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

// Pixel transparente 1x1 em base64 (GIF)
const TRANSPARENT_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
])

// Headers para o pixel (permite qualquer origem - necessário para email clients)
// NOTA: track-pixel é exceção ao CORS restritivo pois precisa funcionar
// em qualquer email client (Gmail, Outlook, Apple Mail, etc.)
const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': TRANSPARENT_PIXEL.length.toString(),
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  // CORS aberto necessário para email clients
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
}

// =============================================================================
// TIPOS
// =============================================================================

interface TrackingEvent {
  tracking_id: string
  event_type: 'open'
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  is_self_open: boolean
  metadata: Record<string, unknown>
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  function: string
  action: string
  tracking_id?: string
  ip_address?: string
  duration_ms?: number
  error?: string
  timestamp: string
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Logger estruturado para produção
 */
function log(entry: Omit<LogEntry, 'timestamp' | 'function'>): void {
  const fullEntry: LogEntry = {
    ...entry,
    function: 'track-pixel',
    timestamp: new Date().toISOString(),
  }
  
  // Em produção, enviar para serviço de logging externo
  // Em desenvolvimento, usar console
  if (Deno.env.get('ENVIRONMENT') !== 'production') {
    if (entry.level === 'error') {
      console.error(JSON.stringify(fullEntry))
    } else if (entry.level === 'warn') {
      console.warn(JSON.stringify(fullEntry))
    } else {
      console.log(JSON.stringify(fullEntry))
    }
  }
  
  // TODO: Integrar com serviço de logging (Datadog, LogDNA, etc.)
  // sendToLoggingService(fullEntry)
}

/**
 * Extrai IP real do cliente considerando proxies
 */
function getClientIP(headers: Headers): string | null {
  // Ordem de prioridade para headers de IP
  const ipHeaders = [
    'cf-connecting-ip',     // Cloudflare
    'x-real-ip',            // Nginx
    'x-forwarded-for',      // Proxies padrão
    'x-client-ip',          // Apache
    'true-client-ip',       // Akamai
  ]
  
  for (const header of ipHeaders) {
    const value = headers.get(header)
    if (value) {
      // x-forwarded-for pode ter múltiplos IPs, pegar o primeiro
      const ip = value.split(',')[0].trim()
      if (ip && ip !== 'unknown') {
        return ip
      }
    }
  }
  
  return null
}

/**
 * Detecta se é self-open baseado em User-Agent
 */
function isSelfOpen(userAgent: string | null, senderInfo?: string): boolean {
  if (!userAgent) return false
  
  const ua = userAgent.toLowerCase()
  
  // Padrões de self-open conhecidos
  const selfOpenPatterns = [
    'googleimageproxy',     // Gmail proxy
    'yahoo',                // Yahoo mail
    'outlook',              // Outlook preview
    'microsoft office',     // Office clients
    'mozilla thunderbird',  // Thunderbird
  ]
  
  return selfOpenPatterns.some(pattern => ua.includes(pattern))
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

Deno.serve(async (req: Request) => {
  const startTime = performance.now()
  
  // Apenas GET permitido para pixels
  if (req.method !== 'GET') {
    return new Response(TRANSPARENT_PIXEL, {
      status: 200,
      headers: PIXEL_HEADERS,
    })
  }
  
  try {
    // Extrair tracking_id da URL
    const url = new URL(req.url)
    const trackingId = url.searchParams.get('id') || url.pathname.split('/').pop()
    
    if (!trackingId || trackingId === 'track-pixel') {
      log({
        level: 'warn',
        action: 'missing_tracking_id',
      })
      
      return new Response(TRANSPARENT_PIXEL, {
        status: 200,
        headers: PIXEL_HEADERS,
      })
    }
    
    // Extrair informações do request
    const ipAddress = getClientIP(req.headers)
    const userAgent = req.headers.get('User-Agent')
    const referer = req.headers.get('Referer')
    
    // Detectar self-open
    const selfOpen = isSelfOpen(userAgent)
    
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    // Registrar evento de abertura
    const event: TrackingEvent = {
      tracking_id: trackingId,
      event_type: 'open',
      ip_address: ipAddress,
      user_agent: userAgent,
      referer: referer,
      is_self_open: selfOpen,
      metadata: {
        headers: {
          accept_language: req.headers.get('Accept-Language'),
          accept: req.headers.get('Accept'),
        },
        timestamp: new Date().toISOString(),
      },
    }
    
    const { error } = await supabase
      .from('tracking_events')
      .insert(event)
    
    const duration = performance.now() - startTime
    
    if (error) {
      log({
        level: 'error',
        action: 'insert_failed',
        tracking_id: trackingId,
        ip_address: ipAddress || undefined,
        error: error.message,
        duration_ms: duration,
      })
    } else {
      log({
        level: 'info',
        action: 'open_tracked',
        tracking_id: trackingId,
        ip_address: ipAddress || undefined,
        duration_ms: duration,
      })
    }
    
    // Sempre retornar o pixel (mesmo com erro de insert)
    return new Response(TRANSPARENT_PIXEL, {
      status: 200,
      headers: PIXEL_HEADERS,
    })
    
  } catch (error) {
    const duration = performance.now() - startTime
    
    log({
      level: 'error',
      action: 'unexpected_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: duration,
    })
    
    // Sempre retornar o pixel para não quebrar o email
    return new Response(TRANSPARENT_PIXEL, {
      status: 200,
      headers: PIXEL_HEADERS,
    })
  }
})
