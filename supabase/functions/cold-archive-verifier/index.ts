// =============================================================================
// FUXICO — Onda 115: Cold Archive Verifier Worker
// Roda periodicamente (pg_cron / manual) e verifica integridade dos objetos
// arquivados no bucket `cold-archive` referenciados por `partition_archive_log`.
// Para cada archive `pending`: baixa objeto, calcula SHA-256, valida row_count
// contra o payload (JSON array esperado) e chama `verify_partition_archive`.
// =============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireEnv } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BATCH_SIZE = 20

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function countRowsFromPayload(bytes: Uint8Array): number | null {
  // Payloads suportados: JSON array (linhas exportadas) ou NDJSON (uma linha por row).
  try {
    const text = new TextDecoder().decode(bytes)
    const trimmed = text.trimStart()
    if (trimmed.startsWith('[')) {
      const arr = JSON.parse(text)
      return Array.isArray(arr) ? arr.length : null
    }
    // NDJSON — contar linhas não vazias
    let count = 0
    for (const line of text.split('\n')) if (line.trim().length > 0) count++
    return count
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  )

  const { data: pending, error: listErr } = await admin
    .from('partition_archive_log')
    .select('id, partition_name, archive_path, row_count')
    .eq('verification_status', 'pending')
    .not('archive_path', 'is', null)
    .order('archived_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const results: Array<Record<string, unknown>> = []

  for (const row of pending ?? []) {
    const archiveId = row.id as string
    const path = row.archive_path as string

    let objectExists = false
    let checksum = ''
    let observedRows: number | null = null

    try {
      const { data: blob, error: dlErr } = await admin.storage
        .from('cold-archive')
        .download(path)

      if (!dlErr && blob) {
        const buf = new Uint8Array(await blob.arrayBuffer())
        objectExists = true
        checksum = await sha256Hex(buf)
        observedRows = countRowsFromPayload(buf)
      }
    } catch {
      objectExists = false
    }

    const { data: verifyResult, error: verifyErr } = await admin.rpc('verify_partition_archive', {
      _archive_id: archiveId,
      _checksum_sha256: checksum,
      _row_count: observedRows ?? row.row_count ?? 0,
      _object_exists: objectExists,
    })

    results.push({
      archive_id: archiveId,
      partition: row.partition_name,
      status: verifyErr ? 'rpc_failed' : (verifyResult?.[0]?.status ?? 'unknown'),
      message: verifyErr?.message ?? verifyResult?.[0]?.message,
    })
  }

  return new Response(JSON.stringify({
    processed: results.length,
    results,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
