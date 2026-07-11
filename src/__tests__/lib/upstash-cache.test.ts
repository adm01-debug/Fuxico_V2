import { describe, it, expect, beforeEach, vi } from 'vitest';

// Fornece um stub virtual do pacote opcional para os testes.
// Sem isso, o Vite tenta resolver o módulo em tempo de transform e falha.
vi.mock('@upstash/redis', () => {
  class Redis {
    async get(_k: string) { return 'mocked-value'; }
    async set(_k: string, _v: unknown, _opts?: unknown) { /* noop */ }
  }
  return { Redis };
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

  it('inicializa o cache quando URL e TOKEN estão configurados', async () => {
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('VITE_UPSTASH_REDIS_REST_TOKEN', 'token-xyz');
    const { getCache } = await loadFresh();
    const cache = await getCache();
    expect(cache).not.toBeNull();
    expect(await cache!.get('foo')).toBe('mocked-value');
    await expect(cache!.set('foo', 'bar', 60)).resolves.toBeUndefined();
    await expect(cache!.set('foo', 'bar')).resolves.toBeUndefined();
  });
});
