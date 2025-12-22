import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's email stats for insights
    const { data: stats } = await supabaseClient
      .from('email_stats_mv')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    // Generate insights based on stats
    const insights = generateInsights(stats || [])

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateInsights(stats: any[]) {
  if (!stats.length) {
    return [{
      type: 'info',
      title: 'Comece a rastrear',
      description: 'Envie emails rastreados para começar a receber insights.'
    }]
  }

  const insights = []
  const totalEmails = stats.length
  const totalOpens = stats.reduce((sum, s) => sum + (s.open_count || 0), 0)
  const totalClicks = stats.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const openRate = totalEmails > 0 ? (totalOpens / totalEmails * 100).toFixed(1) : 0
  const clickRate = totalOpens > 0 ? (totalClicks / totalOpens * 100).toFixed(1) : 0

  // Open rate insight
  if (Number(openRate) > 50) {
    insights.push({
      type: 'success',
      title: 'Excelente taxa de abertura!',
      description: `Sua taxa de abertura de ${openRate}% está acima da média do mercado.`
    })
  } else if (Number(openRate) < 20) {
    insights.push({
      type: 'warning',
      title: 'Taxa de abertura baixa',
      description: `Com ${openRate}% de abertura, considere revisar seus assuntos de email.`
    })
  }

  // Click rate insight
  if (Number(clickRate) > 10) {
    insights.push({
      type: 'success',
      title: 'Ótimo engajamento!',
      description: `${clickRate}% dos que abrem clicam nos links.`
    })
  }

  // Best time insight
  const hourCounts: Record<number, number> = {}
  stats.forEach(s => {
    if (s.first_opened_at) {
      const hour = new Date(s.first_opened_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  })
  
  const bestHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0]
  
  if (bestHour) {
    insights.push({
      type: 'info',
      title: 'Melhor horário',
      description: `Seus emails têm mais aberturas às ${bestHour[0]}h.`
    })
  }

  return insights
}
