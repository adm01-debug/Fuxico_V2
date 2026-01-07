import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, recipientType, tone, language = 'pt-BR' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um especialista em email marketing e copywriting. Sua tarefa é sugerir linhas de assunto de email altamente eficazes que maximizem taxas de abertura.

Diretrizes:
- Mantenha entre 30-60 caracteres
- Use gatilhos emocionais quando apropriado
- Evite palavras spam como "grátis", "urgente", "promoção"
- Personalize baseado no contexto fornecido
- Considere o tipo de destinatário e tom solicitado
- Responda no idioma: ${language}`;

    const userPrompt = `Contexto do email: ${context || 'Email profissional geral'}
Tipo de destinatário: ${recipientType || 'profissional'}
Tom desejado: ${tone || 'profissional'}

Sugira 5 linhas de assunto otimizadas para alta taxa de abertura.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_subjects',
              description: 'Return 5 optimized email subject line suggestions',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        subject: { type: 'string', description: 'The suggested subject line' },
                        reason: { type: 'string', description: 'Why this subject line is effective' },
                        estimatedOpenRate: { type: 'string', description: 'Estimated open rate improvement (e.g., "+15%")' }
                      },
                      required: ['subject', 'reason', 'estimatedOpenRate']
                    }
                  }
                },
                required: ['suggestions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_subjects' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Extract tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: parse from content if no tool call
    const content = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ 
      suggestions: [
        { subject: 'Não foi possível gerar sugestões', reason: content, estimatedOpenRate: 'N/A' }
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-subject:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
