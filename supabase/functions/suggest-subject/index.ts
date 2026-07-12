import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';
import { sanitizeLlmInput, detectPromptInjection, wrapUserInput } from '../_shared/llm-sanitizer.ts';

const log = createLogger('suggest-subject');

const SuggestSubjectSchema = z.object({
  context: z.string().max(1000).optional(),
  recipientType: z.string().max(100).optional(),
  tone: z.string().max(50).optional(),
  language: z.enum(['pt-BR', 'en', 'es']).default('pt-BR')
});

// eslint-disable-next-line sonarjs/cognitive-complexity -- orchestration handler; branches are linear guard checks
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "suggest-subject", 20, 60);
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

    const body = await req.json();
    const validation = SuggestSubjectSchema.safeParse(body);
    
    if (!validation.success) {
      return secureErrorResponse({ 
        error: "Validation failed", 
        details: validation.error.flatten() 
      }, 400, corsHeaders);
    }

    const { context, recipientType, tone, language } = validation.data;

    // SECURITY: Check for prompt injection in user inputs
    const userInputs = [context, recipientType, tone].filter(Boolean) as string[];
    if (userInputs.some(input => detectPromptInjection(input))) {
      log.warn("Prompt injection attempt detected", { userId: user.id });
      return secureErrorResponse("Invalid input detected", 400, corsHeaders);
    }

    // SECURITY: Sanitize all user inputs
    const safeContext = sanitizeLlmInput(context || 'Email profissional geral');
    const safeRecipientType = sanitizeLlmInput(recipientType || 'profissional');
    const safeTone = sanitizeLlmInput(tone || 'profissional');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      log.error("LOVABLE_API_KEY is not configured");
      return secureErrorResponse("AI service not configured", 503, corsHeaders);
    }

    const systemPrompt = `Você é um especialista em email marketing e copywriting. Sua tarefa é sugerir linhas de assunto de email altamente eficazes que maximizem taxas de abertura.

Diretrizes:
- Mantenha entre 30-60 caracteres
- Use gatilhos emocionais quando apropriado
- Evite palavras spam como "grátis", "urgente", "promoção"
- Personalize baseado no contexto fornecido
- Considere o tipo de destinatário e tom solicitado
- Responda no idioma: ${language}`;

    const userPrompt = `Contexto do email: ${wrapUserInput('context', safeContext)}
Tipo de destinatário: ${wrapUserInput('recipientType', safeRecipientType)}
Tom desejado: ${wrapUserInput('tone', safeTone)}

Sugira 5 linhas de assunto otimizadas para alta taxa de abertura.`;

    log.info("Generating subject suggestions", { userId: user.id, language });

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
    log.debug("AI response received");

    // Extract tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      let suggestions;
      try {
        suggestions = JSON.parse(toolCall.function.arguments);
      } catch {
        log.error("Failed to parse tool call arguments");
        return secureErrorResponse("Invalid AI response format", 500, corsHeaders);
      }
      log.info("Generated suggestions successfully", { count: suggestions.suggestions?.length || 0 });
      return secureJsonResponse(suggestions, corsHeaders);
    }

    // Fallback: parse from content if no tool call
    const content = data.choices?.[0]?.message?.content || '';
    log.warn("No tool call response, using fallback");
    return secureJsonResponse({ 
      suggestions: [
        { subject: 'Não foi possível gerar sugestões', reason: content, estimatedOpenRate: 'N/A' }
      ]
    }, corsHeaders);

  } catch (error) {
    log.error("Error in suggest-subject", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return secureErrorResponse({ error: errorMessage }, 500, corsHeaders);
  }
});
