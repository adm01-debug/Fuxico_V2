// =============================================================================
// FUXICO - DSAR Export (LGPD Art. 19)
// Gera JSON com todos os dados PII do titular solicitante.
// =============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

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

  // Create request record
  const { data: dsar, error: dsarErr } = await admin
    .from('dsar_requests')
    .insert({ user_id: userId, request_type: 'export', status: 'processing' })
    .select()
    .single()
  if (dsarErr) return json({ error: dsarErr.message }, 500)

  try {
    // Aggregate PII from relevant tables
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

    await admin.from('dsar_requests').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      download_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      export_path: `inline:${dsar.id}`,
    }).eq('id', dsar.id)

    return json({ dsar_id: dsar.id, data: payload })
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
