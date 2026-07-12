// =============================================================================
// FUXICO - LLM Input Sanitizer
// Arquivo: supabase/functions/_shared/llm-sanitizer.ts
// Descricao: Previne prompt injection em inputs enviados para LLMs
// =============================================================================

/**
 * Padroes comuns de prompt injection.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+a/i,
  /new\s+instructions?\s*:/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
];

/**
 * Sanitiza input do usuario antes de inclui-lo em prompts de LLM.
 * Remove tentativas de prompt injection e escapa delimitadores.
 */
export function sanitizeLlmInput(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Truncate to reasonable length (prevents token abuse)
  sanitized = sanitized.substring(0, 2000);

  // Remove control characters that could confuse tokenizers
  // eslint-disable-next-line no-control-regex -- intentional strip of control chars from LLM input
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Escape common prompt delimiters
  sanitized = sanitized
    .replace(/```/g, '` ` `')
    .replace(/---/g, '- - -')
    .replace(/###/g, '# # #');

  return sanitized;
}

/**
 * Verifica se o input contem padroes suspeitos de prompt injection.
 * Retorna true se injection detectada.
 */
export function detectPromptInjection(input: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Encapsula user input de forma segura para inclusao em system prompts.
 * Usa delimitadores claros para separar instrucoes de dados do usuario.
 */
export function wrapUserInput(label: string, value: string): string {
  const sanitized = sanitizeLlmInput(value);
  return `[USER_DATA:${label}]${sanitized}[/USER_DATA:${label}]`;
}
