import { supabase } from './supabase';

/**
 * Type-safe API client for Edge Functions
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: { timeout?: number }
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeout || 30000);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Batch API calls with concurrency limit
 */
export async function batchCalls<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Create query string from object
 */
export function toQueryString(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}
