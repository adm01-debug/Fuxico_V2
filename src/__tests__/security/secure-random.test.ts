import { describe, it, expect } from 'vitest';
import {
  secureRandomInt,
  secureRandomString,
  generateBackupCodes,
  cosmeticInt,
  cosmeticRange,
} from '@/lib/secure-random';

describe('secure-random', () => {
  describe('secureRandomInt', () => {
    it('mantém os valores dentro do intervalo [0, max)', () => {
      for (let i = 0; i < 500; i++) {
        const value = secureRandomInt(10);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('rejeita limites inválidos', () => {
      expect(() => secureRandomInt(0)).toThrow(RangeError);
      expect(() => secureRandomInt(-1)).toThrow(RangeError);
      expect(() => secureRandomInt(1.5)).toThrow(RangeError);
    });

    it('distribui razoavelmente entre os valores possíveis', () => {
      const buckets = new Set<number>();
      for (let i = 0; i < 300; i++) buckets.add(secureRandomInt(4));
      expect(buckets.size).toBe(4);
    });
  });

  describe('secureRandomString', () => {
    it('gera o comprimento pedido com alfabeto sem caracteres ambíguos', () => {
      const value = secureRandomString(16);
      expect(value).toHaveLength(16);
      expect(value).toMatch(/^[ABCDEFGHJKMNPQRSTVWXYZ0-9]+$/);
    });

    it('rejeita comprimento inválido', () => {
      expect(() => secureRandomString(0)).toThrow(RangeError);
    });
  });

  describe('generateBackupCodes', () => {
    it('gera a quantidade solicitada no formato XXXX-XXXX', () => {
      const codes = generateBackupCodes(10);
      expect(codes).toHaveLength(10);
      codes.forEach((code) => {
        expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTVWXYZ0-9]{4}-[ABCDEFGHJKMNPQRSTVWXYZ0-9]{4}$/);
      });
    });

    it('não repete códigos dentro do mesmo lote', () => {
      const codes = generateBackupCodes(24);
      expect(new Set(codes).size).toBe(24);
    });
  });

  describe('helpers cosméticos', () => {
    it('cosmeticInt respeita os limites inclusivos', () => {
      for (let i = 0; i < 200; i++) {
        const value = cosmeticInt(2, 5);
        expect(value).toBeGreaterThanOrEqual(2);
        expect(value).toBeLessThanOrEqual(5);
      }
    });

    it('cosmeticRange respeita o intervalo', () => {
      for (let i = 0; i < 200; i++) {
        const value = cosmeticRange(-10, 10);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThan(10);
      }
    });
  });
});
