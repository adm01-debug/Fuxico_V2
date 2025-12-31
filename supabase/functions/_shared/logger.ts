// =============================================================================
// FUXICO - Deno Logger for Edge Functions
// Arquivo: supabase/functions/_shared/logger.ts
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  function: string;
  data?: unknown;
  error?: { name: string; message: string; stack?: string };
  requestId?: string;
  traceId?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Obter nível de log do ambiente (default: info em prod, debug em dev)
const getLogLevel = (): LogLevel => {
  const envLevel = Deno.env.get('LOG_LEVEL') as LogLevel;
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }
  return Deno.env.get('DENO_ENV') === 'production' ? 'info' : 'debug';
};

const currentLevel: LogLevel = getLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function generateTraceId(): string {
  return crypto.randomUUID().split('-')[0];
}

function formatEntry(entry: Omit<LogEntry, 'timestamp'>): string {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(fullEntry);
}

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Ocultar dados sensíveis
      if (['password', 'token', 'secret', 'apiKey', 'authorization'].includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...[truncated]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
}

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: unknown) => void;
  time: (label: string) => () => void;
  child: (context: Record<string, unknown>) => Logger;
  traceId: string;
}

export function createLogger(functionName: string, requestId?: string): Logger {
  const traceId = requestId || generateTraceId();
  let context: Record<string, unknown> = {};

  const logger: Logger = {
    traceId,
    
    debug: (message: string, data?: unknown) => {
      if (shouldLog('debug')) {
        console.log(formatEntry({
          level: 'debug',
          message,
          function: functionName,
          data: sanitizeData({ ...context, ...((data as object) || {}) }),
          traceId,
        }));
      }
    },
    
    info: (message: string, data?: unknown) => {
      if (shouldLog('info')) {
        console.log(formatEntry({
          level: 'info',
          message,
          function: functionName,
          data: sanitizeData({ ...context, ...((data as object) || {}) }),
          traceId,
        }));
      }
    },
    
    warn: (message: string, data?: unknown) => {
      if (shouldLog('warn')) {
        console.warn(formatEntry({
          level: 'warn',
          message,
          function: functionName,
          data: sanitizeData({ ...context, ...((data as object) || {}) }),
          traceId,
        }));
      }
    },
    
    error: (message: string, error?: unknown) => {
      if (shouldLog('error')) {
        let errorData: { name: string; message: string; stack?: string } | undefined;
        
        if (error instanceof Error) {
          errorData = { name: error.name, message: error.message, stack: error.stack };
        } else if (typeof error === 'string') {
          errorData = { name: 'Error', message: error };
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorData = { name: 'Error', message: String((error as { message: unknown }).message) };
        }
        
        console.error(formatEntry({
          level: 'error',
          message,
          function: functionName,
          error: errorData,
          data: sanitizeData(context),
          traceId,
        }));
      }
    },
    
    time: (label: string): () => void => {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        if (shouldLog('debug')) {
          console.log(formatEntry({
            level: 'debug',
            message: `${label} completed`,
            function: functionName,
            data: { durationMs: parseFloat(duration.toFixed(2)), ...context },
            traceId,
          }));
        }
      };
    },
    
    child: (childContext: Record<string, unknown>): Logger => {
      context = { ...context, ...childContext };
      return logger;
    },
  };

  return logger;
}

// Middleware para logging de requests
export function withLogging<T>(
  functionName: string,
  handler: (req: Request, log: Logger) => Promise<T>
): (req: Request) => Promise<T> {
  return async (req: Request) => {
    const requestId = req.headers.get('x-request-id') || generateTraceId();
    const log = createLogger(functionName, requestId);
    
    const endTimer = log.time('request');
    
    log.info('Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
    });
    
    try {
      const result = await handler(req, log);
      endTimer();
      log.info('Request completed successfully');
      return result;
    } catch (error) {
      endTimer();
      log.error('Request failed', error);
      throw error;
    }
  };
}
