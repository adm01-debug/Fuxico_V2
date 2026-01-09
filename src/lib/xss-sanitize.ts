/**
 * XSS Sanitization Utilities
 * @description Proteção contra Cross-Site Scripting
 */

const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form'];
const DANGEROUS_ATTRS = ['onclick', 'onerror', 'onload', 'onmouseover'];

export function sanitizeHtml(html: string): string {
  let clean = html;
  DANGEROUS_TAGS.forEach(tag => {
    clean = clean.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi'), '');
    clean = clean.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
  });
  DANGEROUS_ATTRS.forEach(attr => {
    clean = clean.replace(new RegExp(`${attr}="[^"]*"`, 'gi'), '');
  });
  return clean;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export function sanitizeInput(input: string): string {
  return escapeHtml(input.trim()).slice(0, 10000);
}
