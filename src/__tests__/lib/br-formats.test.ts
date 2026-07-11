import { describe, it, expect } from 'vitest';
import {
  maskCPF,
  isValidCPF,
  maskCNPJ,
  isValidCNPJ,
  maskPhoneBR,
  isValidPhoneBR,
  maskCEP,
  isValidCEP,
  formatBRL,
} from '@/lib/br-formats';

describe('br-formats › CPF', () => {
  it('mascara conforme o usuário digita', () => {
    expect(maskCPF('123')).toBe('123');
    expect(maskCPF('12345')).toBe('123.45');
    expect(maskCPF('12345678')).toBe('123.456.78');
    expect(maskCPF('12345678901')).toBe('123.456.789-01');
  });

  it('trunca em 11 dígitos', () => {
    expect(maskCPF('123456789012345')).toBe('123.456.789-01');
  });

  it('ignora caracteres não numéricos', () => {
    expect(maskCPF('abc123def456ghi789jk01')).toBe('123.456.789-01');
  });

  it('valida CPF real (dígitos verificadores corretos)', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(isValidCPF('529.982.247-99')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
  });

  it('rejeita CPF com tamanho inválido', () => {
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('123456789012')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });
});

describe('br-formats › CNPJ', () => {
  it('mascara conforme o usuário digita', () => {
    expect(maskCNPJ('11')).toBe('11');
    expect(maskCNPJ('11222')).toBe('11.222');
    expect(maskCNPJ('11222333')).toBe('11.222.333');
    expect(maskCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('trunca em 14 dígitos', () => {
    expect(maskCNPJ('112223330001819999')).toBe('11.222.333/0001-81');
  });

  it('valida CNPJ real (dígitos verificadores corretos)', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(isValidCNPJ('11.222.333/0001-99')).toBe(false);
  });

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
  });

  it('rejeita CNPJ com tamanho inválido', () => {
    expect(isValidCNPJ('123')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
  });
});

describe('br-formats › Telefone BR', () => {
  it('mascara fixo com 10 dígitos', () => {
    expect(maskPhoneBR('1133334444')).toBe('(11) 3333-4444');
  });

  it('mascara celular com 11 dígitos', () => {
    expect(maskPhoneBR('11987654321')).toBe('(11) 98765-4321');
  });

  it('mascara parcial durante digitação', () => {
    // Regex de máscara só aplica parênteses quando o 3º dígito chega.
    expect(maskPhoneBR('11')).toBe('11');
    expect(maskPhoneBR('119')).toBe('(11) 9');
    expect(maskPhoneBR('1198765')).toBe('(11) 9876-5');
  });

  it('valida tamanhos 10 e 11', () => {
    expect(isValidPhoneBR('1133334444')).toBe(true);
    expect(isValidPhoneBR('11987654321')).toBe(true);
    expect(isValidPhoneBR('(11) 98765-4321')).toBe(true);
  });

  it('rejeita tamanhos inválidos', () => {
    expect(isValidPhoneBR('123')).toBe(false);
    expect(isValidPhoneBR('123456789012')).toBe(false);
  });
});

describe('br-formats › CEP', () => {
  it('mascara com hífen após 5 dígitos', () => {
    expect(maskCEP('01310100')).toBe('01310-100');
    expect(maskCEP('01310')).toBe('01310');
    expect(maskCEP('013101')).toBe('01310-1');
  });

  it('trunca em 8 dígitos', () => {
    expect(maskCEP('013101009999')).toBe('01310-100');
  });

  it('valida tamanho 8', () => {
    expect(isValidCEP('01310-100')).toBe(true);
    expect(isValidCEP('01310100')).toBe(true);
    expect(isValidCEP('0131010')).toBe(false);
  });
});

describe('br-formats › Moeda BRL', () => {
  it('formata número positivo', () => {
    // Intl usa espaço não-quebrável entre símbolo e valor.
    expect(formatBRL(1234.5).replace(/\s+/g, ' ')).toBe('R$ 1.234,50');
  });

  it('formata zero e negativo', () => {
    expect(formatBRL(0).replace(/\s+/g, ' ')).toBe('R$ 0,00');
    expect(formatBRL(-10).replace(/\s+/g, ' ')).toContain('10,00');
  });

  it('trata NaN e Infinity como zero', () => {
    expect(formatBRL(NaN).replace(/\s+/g, ' ')).toBe('R$ 0,00');
    expect(formatBRL(Infinity).replace(/\s+/g, ' ')).toBe('R$ 0,00');
  });
});
