import { describe, it, expect, beforeEach, vi } from 'vitest';

// Isola módulo para resetar o singleton entre testes
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
    const cache = await getCache();
    expect(cache).toBeNull();
  });

  it('retorna null quando apenas URL está definida', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', '');
    const { getCache } = await loadFresh();
    expect(await getCache()).toBeNull();
  });

  it('retorna null quando o pacote @upstash/redis não está instalado', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', 'token-xyz');
    const { getCache } = await loadFresh();
    // Sem @upstash/redis instalado o dynamic import falha → cai no catch → null.
    const cache = await getCache();
    expect(cache).toBeNull();
  });
});
