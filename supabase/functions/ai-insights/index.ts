import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch tracking events data for analysis
    const { data: events, error: eventsError } = await supabase
      .from('tracking_events')
      .select(`
        id,
        event_type,
        created_at,
        tracking_id,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw new Error('Failed to fetch tracking data');
    }

    // Fetch email stats
    const { data: emailStats } = await supabase
      .rpc('get_user_tracking_stats', { p_user_id: user.id });

    // Fetch recent emails with stats
    const { data: emails } = await supabase
      .rpc('get_emails_with_stats', { 
        p_user_id: user.id,
        p_limit: 100
      });

    // Prepare data for AI analysis
    const hourlyDistribution: Record<number, { opens: number; clicks: number }> = {};
    const dayOfWeekDistribution: Record<number, { opens: number; clicks: number }> = {};
    
    // Filter events by user's emails
    const userTrackingIds = new Set(emails?.map((e: any) => e.tracking_id) || []);
    const userEvents = events?.filter((e: any) => userTrackingIds.has(e.tracking_id)) || [];

    userEvents.forEach((event: any) => {
      const date = new Date(event.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      if (!hourlyDistribution[hour]) {
        hourlyDistribution[hour] = { opens: 0, clicks: 0 };
      }
      if (!dayOfWeekDistribution[dayOfWeek]) {
        dayOfWeekDistribution[dayOfWeek] = { opens: 0, clicks: 0 };
      }

      if (event.event_type === 'open') {
        hourlyDistribution[hour].opens++;
        dayOfWeekDistribution[dayOfWeek].opens++;
      } else if (event.event_type === 'click') {
        hourlyDistribution[hour].clicks++;
        dayOfWeekDistribution[dayOfWeek].clicks++;
      }
    });

    // Find best hours and days
    const bestHours = Object.entries(hourlyDistribution)
      .map(([hour, data]) => ({ hour: parseInt(hour), ...data, total: data.opens + data.clicks }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const bestDays = Object.entries(dayOfWeekDistribution)
      .map(([day, data]) => ({ day: parseInt(day), dayName: dayNames[parseInt(day)], ...data, total: data.opens + data.clicks }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Calculate engagement patterns
    const totalEmails = emailStats?.[0]?.total_emails || 0;
    const openRate = emailStats?.[0]?.open_rate || 0;
    const clickRate = emailStats?.[0]?.click_rate || 0;
    const bounceRate = emailStats?.[0]?.bounce_rate || 0;

    // Prepare prompt for AI
    const analysisData = {
      totalEmails,
      openRate,
      clickRate,
      bounceRate,
      bestHours: bestHours.map(h => `${h.hour}:00 (${h.total} interações)`).join(', '),
      bestDays: bestDays.map(d => `${d.dayName} (${d.total} interações)`).join(', '),
      recentPerformance: emails?.slice(0, 10).map((e: any) => ({
        subject: e.subject?.substring(0, 50),
        opens: e.open_count,
        clicks: e.click_count
      }))
    };

    const prompt = `Analise os seguintes dados de email marketing e forneça insights acionáveis em português:

DADOS:
- Total de emails: ${analysisData.totalEmails}
- Taxa de abertura: ${analysisData.openRate}%
- Taxa de cliques: ${analysisData.clickRate}%
- Taxa de bounce: ${analysisData.bounceRate}%
- Melhores horários: ${analysisData.bestHours || 'Dados insuficientes'}
- Melhores dias: ${analysisData.bestDays || 'Dados insuficientes'}

Emails recentes:
${JSON.stringify(analysisData.recentPerformance, null, 2)}

Forneça:
1. MELHOR HORÁRIO: Recomendação específica de quando enviar emails
2. PADRÕES DE ENGAJAMENTO: O que está funcionando e o que não está
3. SUGESTÕES DE MELHORIA: 3 ações práticas para melhorar resultados
4. ALERTA: Qualquer problema crítico identificado

Seja direto e prático nas recomendações.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em email marketing. Analise dados e forneça insights práticos e acionáveis em português. Seja direto e objetivo.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI gateway error');
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || 'Não foi possível gerar insights.';

    return new Response(JSON.stringify({
      insights,
      stats: {
        totalEmails,
        openRate,
        clickRate,
        bounceRate,
        bestHours,
        bestDays,
        totalEvents: userEvents.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
