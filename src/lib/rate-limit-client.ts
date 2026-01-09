/**
 * Client-side Rate Limiting
 */

interface RateLimitState {
  count: number;
  resetAt: number;
}

const limits: Map<string, RateLimitState> = new Map();

export function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const state = limits.get(key);
  
  if (!state || now > state.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (state.count >= maxRequests) return false;
  
  state.count++;
  return true;
}

export function getRateLimitRemaining(key: string, maxRequests = 100): number {
  const state = limits.get(key);
  if (!state) return maxRequests;
  return Math.max(0, maxRequests - state.count);
}
