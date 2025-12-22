import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const StatsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(500).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
  cursor: z.string().optional()
})

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const rateLimitResult = await checkRateLimit(clientIP, 'get-tracking-stats', 60, 60)
  if (!rateLimitResult.allowed) {
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const url = new URL(req.url)
    const params = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      cursor: url.searchParams.get('cursor')
    }
    
    const validation = StatsQuerySchema.safeParse(params)
    if (!validation.success) {
      return secureJsonResponse({ error: 'Invalid parameters', details: validation.error.issues }, 400, corsHeaders)
    }

    const { limit, offset, cursor } = validation.data

    // Usar view materializada para performance
    let query = supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt('created_at', cursor)
    } else if (offset > 0) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) throw error

    const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null

    return secureJsonResponse({ 
      emails: data || [],
      pagination: { limit, offset, nextCursor, hasMore: !!nextCursor }
    }, 200, { ...corsHeaders, 'Cache-Control': 'private, max-age=30' })
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})
