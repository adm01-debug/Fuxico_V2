// Simplified OpenTelemetry implementation for sandbox
// In production, this would use @opentelemetry/sdk-trace-web and OTLPTraceExporter

export const initTracing = () => {
  console.log("[OTel] Tracing initialized (simulated)");
};

export const startSpan = (name: string) => {
  const startTime = performance.now();
  return {
    end: () => {
      const duration = performance.now() - startTime;
      console.log(`[OTel Span] ${name} took ${duration.toFixed(2)}ms`);
      // Export to metrics if needed
    }
  };
};

export const traceRequest = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const span = startSpan(name);
  try {
    return await fn();
  } finally {
    span.end();
  }
};
