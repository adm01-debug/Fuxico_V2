import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { secureJsonResponse, addSecurityHeaders } from '../_shared/security-headers.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Schema de validação
const InsightsRequestSchema = z.object({
  limit: z.number().min(1).max(500).optional().default(100)
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  // Rate limiting
  const rateLimitResult = await checkRateLimit(clientIP, 'ai-insights', 60, 30)
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

    // Parse e validar body
    let params = { limit: 100 }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const validation = InsightsRequestSchema.safeParse(body)
      if (!validation.success) {
        return secureJsonResponse({ error: 'Invalid request', details: validation.error.issues }, 400, corsHeaders)
      }
      params = validation.data
    }

    const { data: stats } = await supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(params.limit)

    const insights = generateInsights(stats || [])
    return secureJsonResponse({ insights }, 200, corsHeaders)
  } catch (error) {
    return secureJsonResponse({ error: error.message }, 500, corsHeaders)
  }
})

function generateInsights(stats: any[]) {
  if (!stats.length) {
    return [{ type: 'info', title: 'Comece a rastrear', description: 'Envie emails rastreados para receber insights.' }]
  }
  const insights = []
  const totalEmails = stats.length
  const totalOpens = stats.reduce((sum, s) => sum + (s.opens || 0), 0)
  const totalClicks = stats.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const openRate = totalEmails > 0 ? (totalOpens / totalEmails * 100).toFixed(1) : 0
  const clickRate = totalOpens > 0 ? (totalClicks / totalOpens * 100).toFixed(1) : 0

  if (Number(openRate) > 50) {
    insights.push({ type: 'success', title: 'Excelente taxa de abertura!', description: `${openRate}% está acima da média.` })
  } else if (Number(openRate) < 20) {
    insights.push({ type: 'warning', title: 'Taxa de abertura baixa', description: `${openRate}% - revise seus assuntos.` })
  }
  if (Number(clickRate) > 10) {
    insights.push({ type: 'success', title: 'Ótimo engajamento!', description: `${clickRate}% clicam nos links.` })
  }
  return insights
}
