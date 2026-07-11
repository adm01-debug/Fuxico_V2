import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock virtual do pacote opcional para permitir simular
// diferentes cenários (ausência / falha / sucesso).
vi.mock('@upstash/redis', () => {
  throw new Error('module not installed');
});

async function loadFresh() {
  vi.resetModules();
  return await import('@/lib/upstash-cache');
}

describe('upstash-cache › graceful degradation', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('retorna null quando URL/TOKEN não estão configurados', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', '');
    const { getCache } = await loadFresh();
    expect(await getCache()).toBeNull();
  });

  it('retorna null quando apenas URL está definida', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', '');
    const { getCache } = await loadFresh();
    expect(await getCache()).toBeNull();
  });

  it('retorna null quando o pacote @upstash/redis não pode ser carregado', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', 'token-xyz');
    const { getCache } = await loadFresh();
    // Sem @upstash/redis disponível o dynamic import falha → cai no catch → null.
    expect(await getCache()).toBeNull();
  });
});
