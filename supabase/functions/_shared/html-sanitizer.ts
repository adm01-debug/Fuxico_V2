// =============================================================================
// FUXICO - HTML Sanitizer for Email Content
// Arquivo: supabase/functions/_shared/html-sanitizer.ts
// Descricao: Sanitiza conteudo HTML para prevenir XSS em emails
// =============================================================================

/**
 * Tags HTML permitidas em emails.
 * Baseado nas tags comumente suportadas por clientes de email.
 */
const _ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table',
  'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'blockquote',
  'pre', 'code', 'center', 'font', 'sub', 'sup', 'small',
]);

/**
 * Atributos permitidos por tag.
 */
const _ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['style', 'class', 'id', 'dir', 'lang', 'title']),
  'a': new Set(['href', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'width', 'height']),
  'td': new Set(['colspan', 'rowspan', 'width', 'height', 'align', 'valign']),
  'th': new Set(['colspan', 'rowspan', 'width', 'height', 'align', 'valign']),
  'table': new Set(['border', 'cellpadding', 'cellspacing', 'width']),
  'font': new Set(['color', 'size', 'face']),
};

/**
 * Protocolos permitidos em atributos href/src.
 */
const _ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Remove tags de script, event handlers, e conteudo perigoso de HTML.
 * Nao e um sanitizer completo como DOMPurify, mas previne ataques comuns.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content (prevents CSS-based attacks)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: protocol in href/src
  sanitized = sanitized.replace(/(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');

  // Remove data: protocol in src (prevents data exfiltration, but allow data:image for inline images)
  sanitized = sanitized.replace(/src\s*=\s*(?:"data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*')/gi, '');

  // Remove expression() in style attributes (IE CSS expressions)
  sanitized = sanitized.replace(/expression\s*\(/gi, 'expr-blocked(');

  // Remove url() with javascript: in styles
  sanitized = sanitized.replace(/url\s*\(\s*(?:"|')?\s*javascript:/gi, 'url(blocked:');

  // Remove <object>, <embed>, <applet>, <iframe>, <form>, <input>, <button>, <textarea>, <select>
  const DANGEROUS_TAGS = [
    'object', 'embed', 'applet', 'iframe', 'form',
    'input', 'button', 'textarea', 'select', 'link',
    'meta', 'base', 'svg', 'math',
  ];

  for (const tag of DANGEROUS_TAGS) {
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    const withContent = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(withContent, '');
    sanitized = sanitized.replace(selfClosing, '');
  }

  return sanitized;
}

/**
 * Valida que o HTML nao excede limites de tamanho razoaveis.
 */
export function validateHtmlSize(html: string, maxSizeBytes: number = 512_000): boolean {
  return new TextEncoder().encode(html).length <= maxSizeBytes;
}

/**
 * Sanitiza e valida HTML para envio de email.
 * Retorna o HTML sanitizado ou throws se invalido.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!validateHtmlSize(html)) {
    throw new Error('Email HTML content exceeds maximum size (512KB)');
  }

  return sanitizeHtml(html);
}
