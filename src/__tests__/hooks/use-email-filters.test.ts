import { describe, it, expect } from 'vitest';
import {
  defaultFilters,
  deserializeEmailFilters,
  serializeEmailFilters,
  type EmailFilters,
} from '@/hooks/use-email-filters';

describe('serializeEmailFilters', () => {
  it('converte datas do período personalizado em ISO', () => {
    const filters: EmailFilters = {
      ...defaultFilters,
      period: 'custom',
      dateRange: {
        from: new Date('2024-03-01T00:00:00.000Z'),
        to: new Date('2024-03-31T23:59:59.000Z'),
      },
      minOpens: 3,
      status: 'opened',
      sortBy: 'opens',
      sortOrder: 'asc',
    };

    expect(serializeEmailFilters(filters)).toEqual({
      search: '',
      status: 'opened',
      period: 'custom',
      dateRange: { from: '2024-03-01T00:00:00.000Z', to: '2024-03-31T23:59:59.000Z' },
      minOpens: 3,
      sortBy: 'opens',
      sortOrder: 'asc',
    });
  });

  it('grava null quando não há datas selecionadas', () => {
    const payload = serializeEmailFilters(defaultFilters);
    expect(payload.dateRange).toEqual({ from: null, to: null });
  });
});

describe('deserializeEmailFilters', () => {
  it('reconstrói datas e mantém valores válidos', () => {
    const restored = deserializeEmailFilters({
      search: 'ana',
      status: 'clicked',
      period: 'custom',
      dateRange: { from: '2024-03-01T00:00:00.000Z', to: null },
      minOpens: 2,
      sortBy: 'clicks',
      sortOrder: 'asc',
    });

    expect(restored.search).toBe('ana');
    expect(restored.status).toBe('clicked');
    expect(restored.period).toBe('custom');
    expect(restored.dateRange.from?.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    expect(restored.dateRange.to).toBeUndefined();
    expect(restored.minOpens).toBe(2);
    expect(restored.sortBy).toBe('clicks');
    expect(restored.sortOrder).toBe('asc');
  });

  it('faz round-trip com serialize', () => {
    const original: EmailFilters = {
      ...defaultFilters,
      search: 'promo',
      status: 'not-opened',
      period: '7days',
      minOpens: 1,
      sortBy: 'recipient',
      sortOrder: 'asc',
    };
    expect(deserializeEmailFilters(serializeEmailFilters(original))).toEqual(original);
  });

  it('ignora valores inválidos e cai no padrão', () => {
    const restored = deserializeEmailFilters({
      search: 42,
      status: 'inexistente',
      period: 'ontem',
      dateRange: 'ontem',
      minOpens: -5,
      sortBy: 'nome',
      sortOrder: 'crescente',
    });

    expect(restored).toEqual({ ...defaultFilters, dateRange: { from: undefined, to: undefined } });
  });

  it('trata data inválida como ausente', () => {
    const restored = deserializeEmailFilters({
      period: 'custom',
      dateRange: { from: 'não é data', to: '2024-13-45T00:00:00.000Z' },
    });

    expect(restored.dateRange.from).toBeUndefined();
    expect(restored.dateRange.to).toBeUndefined();
  });

  it('tolera JSON inesperado', () => {
    expect(deserializeEmailFilters(null)).toEqual({
      ...defaultFilters,
      dateRange: { from: undefined, to: undefined },
    });
    expect(deserializeEmailFilters('texto')).toEqual({
      ...defaultFilters,
      dateRange: { from: undefined, to: undefined },
    });
  });

  it('normaliza aberturas mínimas fracionárias', () => {
    const restored = deserializeEmailFilters({ minOpens: 4.7 });
    expect(restored.minOpens).toBe(4);
  });
});
