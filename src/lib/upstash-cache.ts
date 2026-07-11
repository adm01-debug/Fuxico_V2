/**
 * Optional Upstash Redis client — activated when
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
 *
 * Kept behind lazy dynamic import so bundle stays lean when unused.
 */
import { logger } from "./logger";

let cache: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown, ttl?: number) => Promise<void> } | null = null;

export async function getCache() {
  if (cache) return cache;
  const url = import.meta.env.VITE_UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // @ts-expect-error — opcional; instalar `@upstash/redis` quando cache Redis for habilitado
    const { Redis } = await import(/* @vite-ignore */ "@upstash/redis");
    const client = new Redis({ url, token });
    cache = {
      get: (k) => client.get(k),
      set: async (k, v, ttl) => {
        if (ttl) await client.set(k, v, { ex: ttl });
        else await client.set(k, v);
      },
    };
    return cache;
  } catch (err) {
    logger.warn("Upstash Redis não disponível — degradando para sem cache", { err });
    return null;
  }
}
