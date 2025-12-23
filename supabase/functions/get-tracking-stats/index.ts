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

  const rateLimitResult = await checkRateLimit(ip, 'get-tracking-stats', 30, 60)
  if (!rateLimitResult.allowed) return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const cursor = url.searchParams.get('cursor') // ISO timestamp for cursor-based pagination
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit + 1) // Fetch one extra to check if there's more

    // Use cursor if provided, otherwise use offset
    if (cursor) {
      query = query.lt('created_at', cursor)
    } else if (offset > 0) {
      query = query.range(offset, offset + limit)
    }

    const { data, error } = await query
    if (error) throw error

    const hasMore = data && data.length > limit
    const emails = hasMore ? data.slice(0, limit) : (data || [])
    const nextCursor = hasMore && emails.length > 0 ? emails[emails.length - 1].created_at : null

    return secureJsonResponse({
      emails,
      pagination: {
        limit,
        hasMore,
        nextCursor,
        total: emails.length
      }
    }, 200, { ...corsHeaders, 'Cache-Control': 'private, max-age=30' })
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
