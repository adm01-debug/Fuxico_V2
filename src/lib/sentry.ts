import { log } from './logger';

/**
 * Sentry Error Tracking Configuration
 * @module lib/sentry
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
}

interface SentryBreadcrumb {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// Sentry-like interface for when real Sentry is not available
const mockSentry = {
  init: (_config: SentryConfig) => {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] Mock initialized - install @sentry/react for production');
    }
  },
  captureException: (error: Error, context?: Record<string, unknown>) => {
    console.error('[Sentry] Error captured:', error.message, context);
    return 'mock-event-id';
  },
  captureMessage: (message: string, level: string = 'info') => {
    log.info(`[Sentry] Message (${level}):`, { message });
    return 'mock-event-id';
  },
  setUser: (user: SentryUser | null) => {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] User set:', user);
    }
  },
  setTag: (key: string, value: string) => {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] Tag set:', key, value);
    }
  },
  setContext: (name: string, context: Record<string, unknown> | null) => {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] Context set:', name, context);
    }
  },
  addBreadcrumb: (breadcrumb: SentryBreadcrumb) => {
    if (import.meta.env.DEV) {
      console.debug('[Sentry] Breadcrumb:', breadcrumb);
    }
  },
  withScope: (callback: (scope: unknown) => void) => {
    callback({
      setTag: () => {},
      setExtra: () => {},
      setUser: () => {},
    });
  },
};

// Try to use real Sentry if available, otherwise use mock
const Sentry = mockSentry;

// Initialize Sentry
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] No DSN configured - using mock implementation');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    release: `fuxico@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Capture exception with context
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string {
  return Sentry.captureException(error, context);
}

// Capture message
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

// Set user context
export function setUser(user: SentryUser | null): void {
  Sentry.setUser(user);
}

// Set tag
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

// Set context
export function setContext(
  name: string,
  context: Record<string, unknown> | null
): void {
  Sentry.setContext(name, context);
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// With scope wrapper
export function withScope(callback: (scope: unknown) => void): void {
  Sentry.withScope(callback);
}

// Export for direct access if needed
export { Sentry };
