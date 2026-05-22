// Simplified OpenTelemetry implementation for sandbox
// In production, this would use @opentelemetry/sdk-trace-web and OTLPTraceExporter

import { log } from './logger';

export const initTracing = () => {
  log.info("[OTel] Tracing initialized (simulated)");
};

export const startSpan = (name: string) => {
  const startTime = performance.now();
  return {
    end: () => {
      const duration = performance.now() - startTime;
      log.debug(`[OTel Span] ${name} took ${duration.toFixed(2)}ms`);
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
