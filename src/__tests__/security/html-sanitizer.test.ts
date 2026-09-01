import { describe, it, expect } from 'vitest';

// Port sanitizer logic for testing (same as _shared/html-sanitizer.ts)
function sanitizeHtml(html: string): string {
  if (!html) return '';
  let s = html;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  s = s.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
  s = s.replace(/src\s*=\s*(?:"data:(?!image\/)[^"]*"|'data:(?!image\/)[^']*')/gi, '');
  s = s.replace(/expression\s*\(/gi, 'expr-blocked(');
  s = s.replace(/url\s*\(\s*(?:"|')?\s*javascript:/gi, 'url(blocked:');
  const DANGEROUS = ['object', 'embed', 'applet', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'base', 'svg', 'math'];
  for (const tag of DANGEROUS) {
    s = s.replace(new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi'), '');
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }
  return s;
}

describe('HTML Sanitizer - Email Security', () => {
  it('should remove script tags', () => {
    expect(sanitizeHtml('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
  });

  it('should remove style tags', () => {
    expect(sanitizeHtml('<style>body{display:none}</style><p>Hi</p>')).toBe('<p>Hi</p>');
  });

  it('should remove event handlers', () => {
    const result = sanitizeHtml('<img src="x.jpg" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('should remove javascript: in href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('should remove iframe tags', () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe('');
  });

  it('should remove form tags', () => {
    expect(sanitizeHtml('<form action="evil.com"><input></form>')).toBe('');
  });

  it('should keep safe HTML tags', () => {
    const safe = '<p>Hello <b>World</b></p>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('should keep links without javascript', () => {
    const safe = '<a href="https://example.com">Link</a>';
    expect(sanitizeHtml(safe)).toBe(safe);
  });

  it('should block CSS expressions', () => {
    const result = sanitizeHtml('<div style="width: expression(alert(1))">');
    expect(result).not.toContain('expression(');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should remove SVG tags (potential XSS vector)', () => {
    expect(sanitizeHtml('<svg onload="alert(1)"><circle r="10"/></svg>')).toBe('');
  });
});
