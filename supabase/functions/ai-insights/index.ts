import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts'
import { secureJsonResponse } from '../_shared/security-headers.ts'
import { createLogger } from '../_shared/logger.ts'
import { protectedHandler } from '../_shared/security-middleware.ts'
import { CommonAiInsightsSchema } from '../_shared/schemas.ts'

const log = createLogger('ai-insights')
const AiInsightsSchema = CommonAiInsightsSchema

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  const endTimer = log.time('request')
  const ip = getClientIP(req.headers)

  log.info('Processing AI insights request', { ip, method: req.method })

  const rateLimitResult = await checkRateLimit(ip, 'ai-insights', 30, 60)
  if (!rateLimitResult.allowed) {
    log.warn('Rate limit exceeded', { ip })
    endTimer()
    return secureJsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      log.warn('Unauthorized request', { authError: authError?.message })
      endTimer()
      return secureJsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    // Parse and validate body
    const body = await req.json().catch(() => ({}))
    const validation = AiInsightsSchema.safeParse(body)
    if (!validation.success) {
      log.warn('Validation failed', { errors: validation.error.errors })
      endTimer()
      return secureJsonResponse({ 
        error: 'Invalid input', 
        details: validation.error.errors 
      }, 400, corsHeaders)
    }

    const { period, trackingId, includeRecommendations } = validation.data
    log.info('Validated request', { period, trackingId, userId: user.id })

    const { data: stats } = await supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    const insights = generateInsights(stats || [], includeRecommendations)
    
    log.info('Insights generated successfully', { count: insights.length })
    endTimer()
    return secureJsonResponse({ insights, period }, 200, corsHeaders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    log.error('Request failed', error)
    endTimer()
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
}

Deno.serve(protectedHandler(handler))

// Type for email stats from materialized view
interface EmailStatsRecord {
  tracking_id: string;
  user_id: string;
  recipient_email: string;
  subject: string | null;
  created_at: string;
  opens: number;
  clicks: number;
}

// Type for insights
interface Insight {
  type: 'info' | 'success' | 'warning';
  title: string;
  description: string;
  metric?: number;
}

function generateInsights(stats: EmailStatsRecord[], includeRecommendations: boolean): Insight[] {
  if (!stats.length) {
    return [{ 
      type: 'info', 
      title: 'Comece a rastrear', 
      description: 'Envie emails rastreados para ver insights.' 
    }]
  }
  
  const insights: Insight[] = []
  const totalEmails = stats.length
  const totalOpens = stats.reduce((sum, s) => sum + (s.opens || 0), 0)
  const totalClicks = stats.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const openRate = totalEmails > 0 ? (totalOpens / totalEmails * 100) : 0
  const clickRate = totalOpens > 0 ? (totalClicks / totalOpens * 100) : 0
  
  // Open rate insights
  if (openRate > 50) {
    insights.push({ 
      type: 'success', 
      title: 'Excelente taxa de abertura!', 
      description: `${openRate.toFixed(1)}% dos seus emails são abertos.`,
      metric: openRate
    })
  } else if (openRate < 20) {
    insights.push({ 
      type: 'warning', 
      title: 'Taxa de abertura baixa', 
      description: `Apenas ${openRate.toFixed(1)}% de abertura. Considere melhorar os assuntos.`,
      metric: openRate
    })
  }
  
  // Click rate insights
  if (clickRate > 10) {
    insights.push({
      type: 'success',
      title: 'Bom engajamento!',
      description: `${clickRate.toFixed(1)}% dos destinatários clicaram nos links.`,
      metric: clickRate
    })
  }

  // Recommendations
  if (includeRecommendations && insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Continue assim!',
      description: `Você tem ${totalEmails} emails rastreados com ${totalOpens} aberturas.`
    })
  }
  
  return insights
}