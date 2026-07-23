// =============================================================================
// FUXICO - DSAR Export (LGPD Art. 19) — Ondas 103 + 111
// Onda 103: JSON com dados PII → bucket privado `dsar-exports` + URL assinada 24h.
// Onda 111: Re-geração automática de URL assinada quando expira (POST {action:"refresh", dsar_id}).
//           SHA-256 checksum salvo em `dsar_requests.notes` para integridade.
// =============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const INLINE_THRESHOLD_BYTES = 2 * 1024 * 1024 // 2MB
const SIGNED_URL_TTL_SECONDS = 24 * 3600
const MAX_REFRESH_WINDOW_DAYS = 30 // Onda 111 — não re-emitir URL após 30 dias do request original

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: claims, error: authErr } = await userClient.auth.getClaims(token)
  if (authErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)

  const userId = claims.claims.sub as string
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Parse body — supports {action:"refresh", dsar_id} for Onda 111 URL renewal
  let body: { action?: string; dsar_id?: string } = {}
  try { body = await req.json() } catch { /* empty body → default export */ }

  // ==========================================================================
  // Onda 111 — REFRESH: re-emitir signed URL de export existente
  // ==========================================================================
  if (body.action === 'refresh' && body.dsar_id) {
    const { data: existing, error: fetchErr } = await admin
      .from('dsar_requests')
      .select('id, user_id, status, export_path, created_at')
      .eq('id', body.dsar_id)
      .eq('user_id', userId) // isolamento — só dono pode renovar
      .single()

    if (fetchErr || !existing) return json({ error: 'not_found' }, 404)
    if (existing.status !== 'completed') return json({ error: 'not_ready' }, 409)
    if (!existing.export_path || existing.export_path.startsWith('inline:')) {
      return json({ error: 'inline_export_no_refresh' }, 400)
    }

    const ageDays = (Date.now() - new Date(existing.created_at).getTime()) / 86400000
    if (ageDays > MAX_REFRESH_WINDOW_DAYS) {
      return json({ error: 'export_expired', message: 'Solicite nova exportação.' }, 410)
    }

    const { data: signed, error: signErr } = await admin.storage
      .from('dsar-exports')
      .createSignedUrl(existing.export_path, SIGNED_URL_TTL_SECONDS)
    if (signErr || !signed) return json({ error: 'sign_failed' }, 500)

    const newExpiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString()
    await admin.from('dsar_requests')
      .update({ download_expires_at: newExpiresAt })
      .eq('id', existing.id)

    return json({
      dsar_id: existing.id,
      mode: 'storage',
      download_url: signed.signedUrl,
      expires_at: newExpiresAt,
      refreshed: true,
    })
  }

  // ==========================================================================
  // Default: gerar novo export
  // ==========================================================================
  const { data: dsar, error: dsarErr } = await admin
    .from('dsar_requests')
    .insert({ user_id: userId, request_type: 'export', status: 'processing' })
    .select()
    .single()
  if (dsarErr) return json({ error: dsarErr.message }, 500)

  try {
    const [emails, scores, seq, prefs, audit] = await Promise.all([
      admin.from('tracked_emails').select('*').eq('user_id', userId),
      admin.from('contact_scores').select('*').eq('user_id', userId),
      admin.from('sequence_enrollments').select('*').eq('user_id', userId),
      admin.from('user_preferences').select('*').eq('user_id', userId),
      admin.from('email_audit_logs').select('*').eq('user_id', userId).limit(5000),
    ])
    const payload = {
      generated_at: new Date().toISOString(),
      user_id: userId,
      tracked_emails: emails.data ?? [],
      contact_scores: scores.data ?? [],
      sequence_enrollments: seq.data ?? [],
      user_preferences: prefs.data ?? [],
      email_audit_logs: audit.data ?? [],
    }

    const serialized = JSON.stringify(payload)
    const bytes = new TextEncoder().encode(serialized)
    const checksum = await sha256Hex(bytes) // Onda 111 — integridade
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString()

    if (bytes.byteLength <= INLINE_THRESHOLD_BYTES) {
      await admin.from('dsar_requests').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        download_expires_at: expiresAt,
        export_path: `inline:${dsar.id}`,
        notes: `sha256=${checksum}`,
      }).eq('id', dsar.id)

      return json({ dsar_id: dsar.id, mode: 'inline', data: payload, checksum })
    }

    const objectPath = `${userId}/${dsar.id}.json`
    const { error: uploadErr } = await admin.storage
      .from('dsar-exports')
      .upload(objectPath, bytes, { contentType: 'application/json', upsert: true })
    if (uploadErr) throw uploadErr

    const { data: signed, error: signErr } = await admin.storage
      .from('dsar-exports')
      .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS)
    if (signErr || !signed) throw signErr ?? new Error('signed_url_failed')

    await admin.from('dsar_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      download_expires_at: expiresAt,
      export_path: objectPath,
      notes: `sha256=${checksum}`,
    }).eq('id', dsar.id)

    return json({
      dsar_id: dsar.id,
      mode: 'storage',
      download_url: signed.signedUrl,
      expires_at: expiresAt,
      size_bytes: bytes.byteLength,
      checksum,
    })
  } catch (e) {
    await admin.from('dsar_requests').update({
      status: 'failed',
      notes: e instanceof Error ? e.message : String(e),
    }).eq('id', dsar.id)
    return json({ error: 'export_failed' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
