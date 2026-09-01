// =============================================================================
// OpenTelemetry-compatible tracing wrapper (browser)
// - Gera trace-parent no formato W3C e propaga em requisições `fetch`.
// - Reporta durações como marks + measures (Performance API) para
//   integração com Web Vitals / Sentry Performance.
// =============================================================================

import { log } from "./logger";

const generateHex = (length: number): string => {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

interface TraceContext {
  traceId: string;
  spanId: string;
}

let currentTrace: TraceContext | null = null;

const buildTraceparent = (ctx: TraceContext): string =>
  `00-${ctx.traceId}-${ctx.spanId}-01`;

/**
 * Substitui `window.fetch` para injetar `traceparent` (W3C Trace Context)
 * em requisições internas — permitindo correlação com Edge Functions.
 */
const installFetchPropagation = () => {
  if (typeof window === "undefined" || !window.fetch) return;
  if ((window as unknown as { __otelPatched?: boolean }).__otelPatched) return;
  (window as unknown as { __otelPatched?: boolean }).__otelPatched = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    try {
      const ctx: TraceContext = {
        traceId: currentTrace?.traceId ?? generateHex(32),
        spanId: generateHex(16),
      };
      const headers = new Headers(init?.headers ?? (typeof input !== "string" && !(input instanceof URL) ? input.headers : undefined));
      if (!headers.has("traceparent")) {
        headers.set("traceparent", buildTraceparent(ctx));
      }
      const nextInit: RequestInit = { ...(init ?? {}), headers };
      return await originalFetch(input as RequestInfo, nextInit);
    } catch {
      return originalFetch(input as RequestInfo, init);
    }
  };
};

export const initTracing = () => {
  currentTrace = {
    traceId: generateHex(32),
    spanId: generateHex(16),
  };
  installFetchPropagation();
  log.info("[OTel] Tracing initialized", { traceId: currentTrace.traceId });
};

export const getTraceparent = (): string | null =>
  currentTrace ? buildTraceparent(currentTrace) : null;

export interface Span {
  end: () => number;
}

export const startSpan = (name: string): Span => {
  const startMark = `otel:${name}:start:${performance.now()}`;
  performance.mark(startMark);
  const startTime = performance.now();
  return {
    end: () => {
      const duration = performance.now() - startTime;
      try {
        performance.measure(`otel:${name}`, { start: startTime, duration });
      } catch {
        /* noop */
      }
      log.debug(`[OTel] ${name} ${duration.toFixed(2)}ms`);
      return duration;
    },
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
