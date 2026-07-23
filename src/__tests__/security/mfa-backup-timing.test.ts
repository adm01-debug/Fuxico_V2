import { describe, it, expect } from 'vitest';

/**
 * Onda 109 — Testa a implementação constant-time-equal replicada
 * exatamente como usada em supabase/functions/totp/index.ts.
 */
function constantTimeEq(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    const x = i < ab.length ? ab[i] : 0;
    const y = i < bb.length ? bb[i] : 0;
    diff |= x ^ y;
  }
  return diff === 0;
}

describe('constantTimeEq (MFA backup codes)', () => {
  it('retorna true para strings idênticas', () => {
    expect(constantTimeEq('ABCD1234', 'ABCD1234')).toBe(true);
  });

  it('retorna false para strings de tamanhos diferentes', () => {
    expect(constantTimeEq('ABCD1234', 'ABCD12345')).toBe(false);
    expect(constantTimeEq('', 'A')).toBe(false);
  });

  it('retorna false quando um byte diverge no início', () => {
    expect(constantTimeEq('XBCD1234', 'ABCD1234')).toBe(false);
  });

  it('retorna false quando um byte diverge no fim', () => {
    expect(constantTimeEq('ABCD1234', 'ABCD1235')).toBe(false);
  });

  it('trata strings vazias', () => {
    expect(constantTimeEq('', '')).toBe(true);
  });
});
