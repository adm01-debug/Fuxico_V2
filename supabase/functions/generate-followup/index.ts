import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';

const log = createLogger('generate-followup');

const FollowUpSchema = z.object({
  originalSubject: z.string().min(1).max(200),
  recipientEmail: z.string().email(),
  daysSinceOriginal: z.number().int().min(0).max(365),
  originalContext: z.string().max(1000).optional(),
  tone: z.enum(['formal', 'friendly', 'urgent']).default('friendly'),
  language: z.enum(['pt-BR', 'en', 'es']).default('pt-BR')
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "generate-followup", 20, 60);
    if (!rateLimit.allowed) {
      return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      log.error("LOVABLE_API_KEY is not configured");
      return secureErrorResponse("AI service not configured", 503, corsHeaders);
    }

    const body = await req.json();
    const validation = FollowUpSchema.safeParse(body);
    
    if (!validation.success) {
      return secureErrorResponse({ 
        error: "Validation failed", 
        details: validation.error.flatten() 
      }, 400, corsHeaders);
    }

    const { 
      originalSubject, 
      recipientEmail, 
      daysSinceOriginal,
      originalContext = '',
      tone,
      language
    } = validation.data;

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

    log.info("Generating follow-up suggestions", { recipientEmail, daysSinceOriginal, userId: user.id });

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
        log.warn("AI rate limit exceeded");
        return secureErrorResponse("Rate limit exceeded. Please try again later.", 429, corsHeaders);
      }
      if (response.status === 402) {
        log.warn("AI payment required");
        return secureErrorResponse("Payment required. Please add credits.", 402, corsHeaders);
      }
      const errorText = await response.text();
      log.error("AI Gateway error", { status: response.status, error: errorText });
      return secureErrorResponse("AI Gateway error", 500, corsHeaders);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log.error("Failed to parse AI response", { content: content.substring(0, 200) });
      return secureErrorResponse("Invalid AI response format", 500, corsHeaders);
    }

    const result = JSON.parse(jsonMatch[0]);

    log.info("Generated suggestions successfully", { count: result.suggestions?.length || 0 });

    return secureJsonResponse(result, corsHeaders);
  } catch (error) {
    log.error("Error generating follow-up", error);
    return secureErrorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
      corsHeaders
    );
  }
});
