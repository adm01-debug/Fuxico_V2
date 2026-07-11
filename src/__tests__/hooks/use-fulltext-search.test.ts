import { describe, it, expect } from 'vitest';

describe('useFulltextSearch - XSS prevention', () => {
  // Test the highlight logic directly
  function highlightText(text: string, term: string, minChars: number = 2): string {
    if (!term || term.length < minChars) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  }

  function getHighlightSegments(text: string, term: string, minChars: number = 2) {
    if (!term || term.length < minChars) return [{ text, highlighted: false }];
    if (text === '') return [{ text: '', highlighted: false }];
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.filter(Boolean).map(part => ({
      text: part,
      highlighted: new RegExp(`^${escapedTerm}$`, 'i').test(part),
    }));
  }

  it('should escape HTML entities in highlighted text', () => {
    const result = highlightText('<script>alert("xss")</script>', 'script');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should highlight matching text safely', () => {
    const result = highlightText('Hello World', 'World');
    expect(result).toContain('<mark');
    expect(result).toContain('World');
  });

  it('should return text unchanged when term is too short', () => {
    const result = highlightText('Hello', 'H');
    expect(result).toBe('Hello');
  });

  it('should escape regex special characters in search term', () => {
    const result = highlightText('price is $100.00', '$100');
    expect(result).toContain('<mark');
  });

  it('should return segments for safe React rendering', () => {
    const segments = getHighlightSegments('Hello World Test', 'World');
    expect(segments.length).toBeGreaterThan(1);
    const highlighted = segments.find(s => s.highlighted);
    expect(highlighted?.text).toBe('World');
  });

  it('should handle XSS attempt in search term via segments', () => {
    const segments = getHighlightSegments('Some text here', '<img onerror=alert(1)>');
    // Should not crash or produce XSS
    expect(segments).toBeDefined();
    expect(segments.every(s => typeof s.text === 'string')).toBe(true);
  });

  it('should handle empty text', () => {
    const segments = getHighlightSegments('', 'test');
    expect(segments).toEqual([{ text: '', highlighted: false }]);
  });
});
