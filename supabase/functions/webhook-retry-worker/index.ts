// =============================================================================
// FUXICO — Onda 112: Webhook Retry Worker (background)
// Executado a cada 2 minutos por pg_cron. Reserva lotes de webhooks pendentes
// via claim_webhook_retries (SKIP LOCKED + advisory lock), reenvia com HMAC,
// e chama finalize_webhook_retry(success|error) com backoff exponencial.
// =============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireEnv } from '../_shared/env.ts'

const BATCH_SIZE = 25
const REQUEST_TIMEOUT_MS = 8000

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (_req) => {
  const admin = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { data: claimed, error } = await admin.rpc('claim_webhook_retries', { p_batch_size: BATCH_SIZE })
  if (error) {
    console.error('claim_webhook_retries failed', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 })
  }
  if (!claimed || claimed.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }))
  }

  // Busca configs em lote
  const webhookIds = [...new Set(claimed.map((r: { webhook_id: string }) => r.webhook_id))]
  const { data: configs } = await admin
    .from('webhook_configs')
    .select('id, url, secret, is_active')
    .in('id', webhookIds)
  const cfgMap = new Map((configs ?? []).map((c: { id: string }) => [c.id, c]))

  let delivered = 0, failed = 0
  await Promise.allSettled(claimed.map(async (row: {
    id: string; webhook_id: string; event_type: string; payload: unknown; attempts: number
  }) => {
    const cfg = cfgMap.get(row.webhook_id) as { url: string; secret: string; is_active: boolean } | undefined
    if (!cfg || !cfg.is_active) {
      await admin.rpc('finalize_webhook_retry', { p_id: row.id, p_success: false, p_error: 'webhook_disabled_or_missing' })
      failed++; return
    }

    const body = JSON.stringify({ event: row.event_type, data: row.payload, id: row.id, attempt: row.attempts })
    let signature = ''
    try { signature = await hmacHex(cfg.secret ?? '', body) } catch { /* no secret */ }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Fuxico-Event': row.event_type,
          'X-Fuxico-Signature': signature,
          'X-Fuxico-Attempt': String(row.attempts),
        },
        body,
      })
      const success = res.ok
      await admin.rpc('finalize_webhook_retry', {
        p_id: row.id,
        p_success: success,
        p_error: success ? null : `http_${res.status}`,
      })
      if (success) { delivered++ } else { failed++ }
    } catch (e) {
      await admin.rpc('finalize_webhook_retry', {
        p_id: row.id,
        p_success: false,
        p_error: e instanceof Error ? e.message : 'network_error',
      })
      failed++
    } finally {
      clearTimeout(timer)
    }
  }))

  return new Response(JSON.stringify({ ok: true, processed: claimed.length, delivered, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
