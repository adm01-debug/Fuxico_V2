// =============================================================================
// FUXICO - Testes do Logger
// Arquivo: src/__tests__/lib/logger.test.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, Logger, log } from '@/lib/logger'

describe('Logger', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Restore console methods for these tests
    vi.restoreAllMocks()
    
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logger methods', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function')
    })

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function')
    })

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function')
    })

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function')
    })

    it('should have time method', () => {
      expect(typeof logger.time).toBe('function')
    })

    it('should have child method', () => {
      expect(typeof logger.child).toBe('function')
    })

    it('should have configure method', () => {
      expect(typeof logger.configure).toBe('function')
    })
  })

  describe('logging behavior in dev mode', () => {
    it('should call console.debug for debug messages', () => {
      logger.debug('Test debug message')
      expect(consoleDebugSpy).toHaveBeenCalled()
    })

    it('should call console.info for info messages', () => {
      logger.info('Test info message')
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should call console.warn for warning messages', () => {
      logger.warn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should call console.error for error messages', () => {
      logger.error('Error message')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should include data in log output', () => {
      logger.info('Test message', { key: 'value' })
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ key: 'value' })
      )
    })
  })

  describe('child logger', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child('TestContext')
      expect(childLogger).toBeInstanceOf(Logger)
    })

    it('should include context in child logger output', () => {
      const childLogger = logger.child('TestContext')
      childLogger.info('Child message')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestContext'),
        expect.any(String)
      )
    })
  })

  describe('timer functionality', () => {
    it('should return a function from time()', () => {
      const end = logger.time('operation')
      expect(typeof end).toBe('function')
    })

    it('should log duration when timer ends', () => {
      const end = logger.time('testOperation')
      end()
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('testOperation completed'),
        expect.objectContaining({ duration: expect.any(String) })
      )
    })
  })

  describe('error handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error')
      logger.error('An error occurred', error)
      
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle null data', () => {
      expect(() => logger.info('Message', null)).not.toThrow()
    })

    it('should handle undefined data', () => {
      expect(() => logger.info('Message')).not.toThrow()
    })

    it('should handle string errors', () => {
      expect(() => logger.error('An error occurred', 'string error')).not.toThrow()
    })
  })

  describe('configure method', () => {
    it('should allow configuration updates', () => {
      expect(() => logger.configure({ level: 'error' })).not.toThrow()
    })
  })
})

describe('log helper object', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should have all logging methods', () => {
    expect(typeof log.debug).toBe('function')
    expect(typeof log.info).toBe('function')
    expect(typeof log.warn).toBe('function')
    expect(typeof log.error).toBe('function')
    expect(typeof log.time).toBe('function')
  })

  it('should call logger methods', () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    
    log.info('Test via helper')
    
    expect(consoleInfoSpy).toHaveBeenCalled()
  })
})

describe('Logger class', () => {
  it('should be exported and constructable', () => {
    const customLogger = new Logger({ level: 'debug' })
    expect(customLogger).toBeInstanceOf(Logger)
  })

  it('should accept custom configuration', () => {
    const customLogger = new Logger({ 
      level: 'error',
      enableConsole: true,
    })
    
    expect(customLogger).toBeInstanceOf(Logger)
  })
})
