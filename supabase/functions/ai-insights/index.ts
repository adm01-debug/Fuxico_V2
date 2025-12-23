import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { aiInsightsSchema, validateRequest } from '../_shared/schemas.ts'
import { secureJsonResponse, addSecurityHeaders } from '../_shared/security-headers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  // Rate limiting
  const rateLimitResult = await checkRateLimit(ip, 'ai-insights', 30, 60)
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

    const { data: stats } = await supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    const insights = generateInsights(stats || [])
    return secureJsonResponse({ insights }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})

function generateInsights(stats: any[]) {
  if (!stats.length) return [{ type: 'info', title: 'Comece a rastrear', description: 'Envie emails rastreados.' }]
  const insights = []
  const totalEmails = stats.length
  const totalOpens = stats.reduce((sum, s) => sum + (s.opens || 0), 0)
  const openRate = totalEmails > 0 ? (totalOpens / totalEmails * 100).toFixed(1) : 0
  if (Number(openRate) > 50) insights.push({ type: 'success', title: 'Excelente!', description: `${openRate}% de abertura.` })
  else if (Number(openRate) < 20) insights.push({ type: 'warning', title: 'Atenção', description: `Apenas ${openRate}% de abertura.` })
  return insights
}
