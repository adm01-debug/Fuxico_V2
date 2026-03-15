// =============================================================================
// FUXICO - Sistema de Logging Estruturado
// Arquivo: src/lib/logger.ts
// Descrição: Substitui console.log por logger configurável e seguro
// =============================================================================

/**
 * Níveis de log disponíveis
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

/**
 * Entrada de log estruturada
 */
interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
  error?: {
    name: string
    message: string
    stack?: string
  }
  duration?: number
  userId?: string
}

/**
 * Configuração do logger
 */
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  contextPrefix?: string
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Hierarquia de níveis de log (menor número = mais verboso)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

/**
 * Configuração padrão baseada no ambiente
 */
const DEFAULT_CONFIG: LoggerConfig = {
  // Em produção: apenas warn e error. Em dev: tudo
  level: import.meta.env.DEV ? 'debug' : 'warn',
  // Console apenas em desenvolvimento
  enableConsole: import.meta.env.DEV,
  // Remote logging em produção
  enableRemote: import.meta.env.PROD,
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  contextPrefix: 'FUXICO',
}

// =============================================================================
// CLASSE LOGGER
// =============================================================================

class Logger {
  private config: LoggerConfig
  private queue: LogEntry[] = []
  private flushInterval: number | null = null
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Iniciar flush periódico para logs remotos
    if (this.config.enableRemote) {
      this.startFlushInterval()
    }
  }
  
  /**
   * Verifica se o nível de log deve ser registrado
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
  }
  
  /**
   * Formata erro para serialização
   */
  private formatError(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
      }
    }
    
    return {
      name: 'UnknownError',
      message: String(error),
    }
  }
  
  /**
   * Cria entrada de log
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: unknown
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.config.contextPrefix,
      data: import.meta.env.DEV ? data : this.sanitizeData(data),
      error: this.formatError(error),
    }
  }
  
  /**
   * Remove dados sensíveis antes de enviar para logs remotos
   */
  private sanitizeData(data: unknown): unknown {
    if (!data) return undefined
    if (typeof data !== 'object') return data
    
    const sensitiveKeys = [
      'password', 'token', 'secret', 'apiKey', 'api_key',
      'authorization', 'auth', 'credential', 'credit_card',
      'ssn', 'cpf', 'cnpj',
    ]
    
    const sanitized = { ...data as Record<string, unknown> }
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]'
      }
    }
    
    return sanitized
  }
  
  /**
   * Envia log para console
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return
    
    const prefix = `[${entry.context}][${entry.level.toUpperCase()}]`
    const args: unknown[] = [prefix, entry.message]
    
    if (entry.data) {
      args.push(entry.data)
    }
    
    switch (entry.level) {
      case 'debug':
        console.debug(...args)
        break
      case 'info':
        console.info(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'error':
        console.error(...args, entry.error?.stack)
        break
    }
  }
  
  /**
   * Adiciona log à fila para envio remoto
   */
  private queueForRemote(entry: LogEntry): void {
    if (!this.config.enableRemote) return
    
    this.queue.push(entry)
    
    // Flush imediato para erros
    if (entry.level === 'error') {
      this.flush()
    }
  }
  
  /**
   * Inicia intervalo de flush para logs remotos
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return
    
    // Flush a cada 30 segundos
    this.flushInterval = window.setInterval(() => {
      this.flush()
    }, 30000)
    
    // Flush ao sair da página
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }
  
  /**
   * Envia logs acumulados para endpoint remoto
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.config.remoteEndpoint) return
    
    const entries = [...this.queue]
    this.queue = []
    
    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
        keepalive: true, // Permite envio durante beforeunload
      })
    } catch {
      // Re-adiciona à fila em caso de falha
      this.queue.unshift(...entries)
    }
  }
  
  /**
   * Processa log
   */
  private log(level: LogLevel, message: string, data?: unknown, error?: unknown): void {
    if (!this.shouldLog(level)) return
    
    const entry = this.createEntry(level, message, data, error)
    
    this.logToConsole(entry)
    this.queueForRemote(entry)
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }
  
  /**
   * Log informativo
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }
  
  /**
   * Log de aviso
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }
  
  /**
   * Log de erro
   */
  error(message: string, error?: unknown, data?: unknown): void {
    this.log('error', message, data, error)
  }
  
  /**
   * Timer para medir duração de operações
   * @returns Função para encerrar o timer
   * 
   * @example
   * const end = logger.time('fetchData')
   * await fetchData()
   * end() // Loga: "fetchData completed in 123.45ms"
   */
  time(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` })
    }
  }
  
  /**
   * Cria logger com contexto específico
   * 
   * @example
   * const authLogger = logger.child('Auth')
   * authLogger.info('User logged in') // [FUXICO:Auth][INFO] User logged in
   */
  child(context: string): Logger {
    return new Logger({
      ...this.config,
      contextPrefix: `${this.config.contextPrefix}:${context}`,
    })
  }
  
  /**
   * Atualiza configuração do logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// =============================================================================
// INSTÂNCIA GLOBAL
// =============================================================================

/**
 * Instância global do logger
 */
export const logger = new Logger()

/**
 * Helpers para uso rápido
 */
export const log = {
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, error?: unknown, data?: unknown) => logger.error(message, error, data),
  time: (label: string) => logger.time(label),
}

// =============================================================================
// EXPORTAÇÕES DE TIPO
// =============================================================================

export type { LogLevel, LogEntry, LoggerConfig }
export { Logger }
