// Shared OTel utilities for Deno Edge Functions

export const traceFunction = async (name: string, context: any, fn: Function) => {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    console.log(`[OTel Edge] Function ${name} took ${duration}ms`);
    // Export via OTLP to collector (e.g. Grafana/Honeycomb)
  }
};
