/* eslint-disable no-console -- structured logging / background job / test diagnostics */
// Shared OTel utilities for Deno Edge Functions

export const traceFunction = async (name: string, context: unknown, fn: () => unknown | Promise<unknown>) => {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    console.log(`[OTel Edge] Function ${name} took ${duration}ms`);
    // Export via OTLP to collector (e.g. Grafana/Honeycomb)
  }
};
