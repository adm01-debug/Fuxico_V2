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

  const rateLimitResult = await checkRateLimit(ip, 'check-deliverability', 30, 60)
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
    const action = url.searchParams.get('action') || 'stats'
    const domain = url.searchParams.get('domain')

    if (action === 'stats') {
      // Buscar métricas de deliverability por domínio
      const { data: stats, error } = await supabaseClient.rpc('calculate_domain_deliverability', {
        p_user_id: user.id
      })

      if (error) throw error

      // Calcular métricas gerais
      const totals = (stats || []).reduce((acc: any, s: any) => ({
        totalSent: acc.totalSent + Number(s.total_sent || 0),
        totalDelivered: acc.totalDelivered + Number(s.total_delivered || 0),
        totalBounced: acc.totalBounced + Number(s.total_bounced || 0),
        totalOpened: acc.totalOpened + Number(s.total_opened || 0),
      }), { totalSent: 0, totalDelivered: 0, totalBounced: 0, totalOpened: 0 })

      const overallDeliveryRate = totals.totalSent > 0 
        ? ((totals.totalDelivered / totals.totalSent) * 100).toFixed(2) 
        : '0.00'
      const overallBounceRate = totals.totalSent > 0 
        ? ((totals.totalBounced / totals.totalSent) * 100).toFixed(2) 
        : '0.00'
      const overallOpenRate = totals.totalDelivered > 0 
        ? ((totals.totalOpened / totals.totalDelivered) * 100).toFixed(2) 
        : '0.00'

      // Calcular score geral de reputação
      const avgReputationScore = stats && stats.length > 0
        ? Math.round(stats.reduce((sum: number, s: any) => sum + (s.reputation_score || 50), 0) / stats.length)
        : 50

      return secureJsonResponse({
        domains: stats || [],
        totals: {
          ...totals,
          deliveryRate: parseFloat(overallDeliveryRate),
          bounceRate: parseFloat(overallBounceRate),
          openRate: parseFloat(overallOpenRate),
          reputationScore: avgReputationScore
        }
      }, 200, corsHeaders)
    }

    if (action === 'check-dns' && domain) {
      // Verificar registros DNS do domínio (SPF, DKIM, DMARC)
      const dnsResults = await checkDomainDNS(domain)
      
      // Salvar/atualizar resultados no banco
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabaseAdmin.from('domain_reputation').upsert({
        user_id: user.id,
        domain,
        spf_valid: dnsResults.spf,
        dkim_valid: dnsResults.dkim,
        dmarc_valid: dnsResults.dmarc,
        last_checked_at: new Date().toISOString()
      }, { onConflict: 'user_id,domain' })

      return secureJsonResponse({ 
        domain,
        dns: dnsResults,
        recommendations: getDNSRecommendations(dnsResults)
      }, 200, corsHeaders)
    }

    if (action === 'history') {
      // Buscar histórico de deliverability
      const { data: logs, error } = await supabaseClient
        .from('deliverability_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start', { ascending: false })
        .limit(30)

      if (error) throw error

      return secureJsonResponse({ logs: logs || [] }, 200, corsHeaders)
    }

    return secureJsonResponse({ error: 'Invalid action' }, 400, corsHeaders)
  } catch (error: unknown) {
    console.error('Deliverability check error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return secureJsonResponse({ error: message }, 500, corsHeaders)
  }
})

async function checkDomainDNS(domain: string): Promise<{ spf: boolean; dkim: boolean; dmarc: boolean }> {
  const results = { spf: false, dkim: false, dmarc: false }
  
  try {
    // Verificar SPF via DNS sobre HTTPS (Cloudflare)
    const spfResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`, {
      headers: { 'Accept': 'application/dns-json' }
    })
    if (spfResponse.ok) {
      const spfData = await spfResponse.json()
      if (spfData.Answer) {
        results.spf = spfData.Answer.some((a: any) => 
          a.data?.toLowerCase().includes('v=spf1')
        )
      }
    }

    // Verificar DMARC
    const dmarcResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_dmarc.${domain}&type=TXT`, {
      headers: { 'Accept': 'application/dns-json' }
    })
    if (dmarcResponse.ok) {
      const dmarcData = await dmarcResponse.json()
      if (dmarcData.Answer) {
        results.dmarc = dmarcData.Answer.some((a: any) => 
          a.data?.toLowerCase().includes('v=dmarc1')
        )
      }
    }

    // Verificar DKIM (seletor padrão - pode variar)
    const dkimSelectors = ['default', 'google', 'selector1', 'selector2', 's1', 's2']
    for (const selector of dkimSelectors) {
      const dkimResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${selector}._domainkey.${domain}&type=TXT`,
        { headers: { 'Accept': 'application/dns-json' } }
      )
      if (dkimResponse.ok) {
        const dkimData = await dkimResponse.json()
        if (dkimData.Answer && dkimData.Answer.length > 0) {
          results.dkim = true
          break
        }
      }
    }
  } catch (error) {
    console.error('DNS check error:', error)
  }

  return results
}

function getDNSRecommendations(dns: { spf: boolean; dkim: boolean; dmarc: boolean }): string[] {
  const recommendations: string[] = []
  
  if (!dns.spf) {
    recommendations.push('Configure um registro SPF para autorizar servidores de envio de email')
  }
  if (!dns.dkim) {
    recommendations.push('Configure DKIM para assinar digitalmente seus emails')
  }
  if (!dns.dmarc) {
    recommendations.push('Configure DMARC para proteger contra spoofing de email')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excelente! Todos os registros DNS de email estão configurados corretamente')
  }
  
  return recommendations
}
