// FUXICO - Edge Function para Configuração Dinâmica
// Permite que a extensão Chrome obtenha configurações atualizadas

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    
    // Configuração pública (sem dados sensíveis)
    const config = {
      version: '1.1.0',
      
      // URLs
      supabaseUrl: supabaseUrl,
      dashboardUrl: 'https://fuxico.lovable.app',
      
      // Endpoints das Edge Functions
      endpoints: {
        createTracking: '/create-tracking',
        trackPixel: '/track-pixel',
        trackLink: '/track-link',
        trackDocument: '/track-document',
        trackStandaloneLink: '/track-standalone-link',
        getStats: '/get-tracking-stats',
        reportBounce: '/report-bounce',
        logEmailActivity: '/log-email-activity',
        getConfig: '/get-config',
      },
      
      // Intervalos (em ms)
      intervals: {
        pollOpens: 30000,
        checkCompose: 1000,
        bounceCheck: 30000,
        auditCheck: 60000,
        tokenRefresh: 1800000, // 30 minutos
      },
      
      // Configurações de detecção
      detection: {
        selfOpenThresholdMs: 120000, // 2 minutos
      },
      
      // Features habilitadas
      features: {
        emailTracking: true,
        linkTracking: true,
        documentTracking: true,
        bounceDetection: true,
        emailAudit: true,
        bitrixIntegration: true,
        webhooks: true,
        geolocation: false, // Será habilitado em versão futura
      },
      
      // Limites
      limits: {
        maxEmailsPerDay: 1000,
        maxLinksPerEmail: 50,
        maxDocumentSizeMb: 10,
      },
    }

    return new Response(JSON.stringify(config), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
      },
    })
  } catch (error) {
    console.error('Error in get-config function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
