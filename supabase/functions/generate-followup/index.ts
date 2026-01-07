import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FollowUpRequest {
  originalSubject: string;
  recipientEmail: string;
  daysSinceOriginal: number;
  originalContext?: string;
  tone?: 'formal' | 'friendly' | 'urgent';
  language?: 'pt-BR' | 'en' | 'es';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { 
      originalSubject, 
      recipientEmail, 
      daysSinceOriginal,
      originalContext = '',
      tone = 'friendly',
      language = 'pt-BR'
    }: FollowUpRequest = await req.json();

    const toneDescriptions: Record<string, string> = {
      formal: 'profissional e formal',
      friendly: 'amigável e cordial',
      urgent: 'urgente mas respeitoso'
    };

    const languageInstructions: Record<string, string> = {
      'pt-BR': 'Responda em português brasileiro.',
      'en': 'Respond in English.',
      'es': 'Responde en español.'
    };

    const systemPrompt = `Você é um especialista em comunicação por email e vendas. Sua tarefa é gerar sugestões de follow-up para emails não respondidos.

${languageInstructions[language]}

Gere exatamente 3 variações de follow-up, cada uma com:
1. Um assunto atraente (máximo 60 caracteres)
2. Um corpo de email curto e eficaz (máximo 150 palavras)
3. Uma pontuação de eficácia estimada (0-100)
4. O principal diferencial dessa abordagem

O tom deve ser ${toneDescriptions[tone]}.

Considere que:
- Já se passaram ${daysSinceOriginal} dias desde o email original
- O destinatário é: ${recipientEmail}
- Assunto original: "${originalSubject}"
${originalContext ? `- Contexto adicional: ${originalContext}` : ''}

Retorne APENAS um JSON válido no formato:
{
  "suggestions": [
    {
      "subject": "Assunto do follow-up",
      "body": "Corpo do email...",
      "effectiveness": 85,
      "approach": "Abordagem direta com valor agregado"
    }
  ],
  "bestTimeToSend": "Horário sugerido para envio",
  "tips": ["Dica 1", "Dica 2"]
}`;

    console.log("Generating follow-up suggestions for:", recipientEmail);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Gere 3 sugestões de follow-up para o email "${originalSubject}" enviado para ${recipientEmail} há ${daysSinceOriginal} dias.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log("Generated suggestions successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
