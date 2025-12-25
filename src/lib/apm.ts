// =============================================================================
// FUXICO - Application Performance Monitoring
// Arquivo: src/lib/apm.ts
// =============================================================================

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
  type: 'timing' | 'counter' | 'gauge';
}

interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface APMConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  endpoint?: string;
  debug: boolean;
  batchSize: number;
  flushInterval: number; // ms
}

// Thresholds para Web Vitals (Google recomendados)
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

class APM {
  private config: APMConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor() {
    this.config = {
      enabled: typeof window !== 'undefined' && import.meta.env.PROD,
      sampleRate: 0.1, // 10% sampling
      debug: import.meta.env.DEV,
      batchSize: 10,
      flushInterval: 30000, // 30 segundos
    };
  }

  configure(config: Partial<APMConfig>) {
    this.config = { ...this.config, ...config };
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    if (!this.config.enabled && !this.config.debug) return;

    this.isInitialized = true;

    // Web Vitals
    this.observeWebVitals();

    // Long Tasks
    this.observeLongTasks();

    // Resource Loading
    this.observeResources();

    // Navigation Timing
    this.recordNavigationTiming();

    // Start flush timer
    if (this.config.endpoint) {
      this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
    }

    // Flush on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    if (this.config.debug) {
      console.log('[APM] Initialized with config:', this.config);
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
    if (!thresholds) return 'good';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private observeWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordWebVital('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch { /* não suportado */ }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[0] as PerformanceEventTiming;
          this.recordWebVital('FID', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch { /* não suportado */ }

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordWebVital('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch { /* não suportado */ }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntriesByName('first-contentful-paint');
        if (entries.length > 0) {
          this.recordWebVital('FCP', entries[0].startTime);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(fcpObserver);
    } catch { /* não suportado */ }
  }

  private recordWebVital(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getRating(name, value);
    
    this.recordMetric({
      name: `web-vital:${name}`,
      value,
      timestamp: Date.now(),
      type: 'gauge',
      metadata: { rating },
    });

    if (this.config.debug) {
      const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
      console.log(`[APM] ${color} ${name}: ${value.toFixed(2)}ms (${rating})`);
    }
  }

  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'long-task',
            value: entry.duration,
            timestamp: Date.now(),
            type: 'timing',
            metadata: {
              attribution: (entry as any).attribution?.[0]?.name,
            },
          });

          if (this.config.debug && entry.duration > 100) {
            console.warn(`[APM] ⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch {
      // longtask não suportado
    }
  }

  private observeResources() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Apenas recursos lentos (>1s)
          if (resourceEntry.duration > 1000) {
            this.recordMetric({
              name: 'slow-resource',
              value: resourceEntry.duration,
              timestamp: Date.now(),
              type: 'timing',
              metadata: {
                url: resourceEntry.name,
                type: resourceEntry.initiatorType,
                transferSize: resourceEntry.transferSize,
              },
            });

            if (this.config.debug) {
              console.warn(`[APM] 🐌 Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(0)}ms)`);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch {
      // não suportado
    }
  }

  private recordNavigationTiming() {
    if (!('performance' in window) || !performance.getEntriesByType) return;

    // Aguardar carregamento completo
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const nav = navEntries[0] as PerformanceNavigationTiming;

          // TTFB
          this.recordWebVital('TTFB', nav.responseStart - nav.requestStart);

          // DOM Interactive
          this.recordMetric({
            name: 'dom-interactive',
            value: nav.domInteractive,
            timestamp: Date.now(),
            type: 'timing',
          });

          // DOM Complete
          this.recordMetric({
            name: 'dom-complete',
            value: nav.domComplete,
            timestamp: Date.now(),
            type: 'timing',
          });
        }
      }, 0);
    });
  }

  recordMetric(metric: PerformanceMetric) {
    // Sampling
    if (Math.random() > this.config.sampleRate && !this.config.debug) return;

    this.metrics.push(metric);

    // Auto flush quando atingir batch size
    if (this.metrics.length >= this.config.batchSize) {
      this.flush();
    }
  }

  startTrace(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `trace:${name}`,
        value: duration,
        timestamp: Date.now(),
        type: 'timing',
      });

      if (this.config.debug) {
        console.log(`[APM] ⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  increment(name: string, value = 1, metadata?: Record<string, unknown>) {
    this.recordMetric({
      name: `counter:${name}`,
      value,
      timestamp: Date.now(),
      type: 'counter',
      metadata,
    });
  }

  gauge(name: string, value: number, metadata?: Record<string, unknown>) {
    this.recordMetric({
      name: `gauge:${name}`,
      value,
      timestamp: Date.now(),
      type: 'gauge',
      metadata,
    });
  }

  private async flush() {
    if (!this.config.endpoint || this.metrics.length === 0) {
      if (this.config.debug && this.metrics.length > 0) {
        console.log('[APM] Metrics (no endpoint):', this.metrics);
      }
      this.metrics = [];
      return;
    }

    const batch = [...this.metrics];
    this.metrics = [];

    try {
      // Usar sendBeacon para garantir envio mesmo em page unload
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify({ metrics: batch, timestamp: Date.now() })
        );
      } else {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: batch, timestamp: Date.now() }),
          keepalive: true,
        });
      }

      if (this.config.debug) {
        console.log(`[APM] Flushed ${batch.length} metrics`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[APM] Failed to flush metrics:', error);
      }
    }
  }

  destroy() {
    this.observers.forEach((o) => o.disconnect());
    this.observers = [];
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.flush();
    this.isInitialized = false;
  }

  // Hook para React
  useTrace(name: string) {
    const endTrace = this.startTrace(name);
    return endTrace;
  }
}

// Singleton
export const apm = new APM();

// React Hook
export function useAPMTrace(name: string) {
  const endTraceRef = { current: () => {} };
  
  if (typeof window !== 'undefined') {
    endTraceRef.current = apm.startTrace(name);
  }
  
  return () => endTraceRef.current();
}

// HOC para componentes
export function withAPMTrace<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  traceName: string
): React.ComponentType<P> {
  return function APMTracedComponent(props: P) {
    if (typeof window !== 'undefined') {
      const endTrace = apm.startTrace(`component:${traceName}`);
      setTimeout(endTrace, 0);
    }
    return <WrappedComponent {...props} />;
  };
}
