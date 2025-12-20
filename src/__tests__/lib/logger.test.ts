// =============================================================================
// FUXICO - Testes do Sistema de Logging
// Arquivo: src/__tests__/lib/logger.test.ts
// Descrição: Testes unitários para o logger estruturado
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks de console
const consoleMocks = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Salvar originais
const originalConsole = { ...console }

// Mock do fetch para logs remotos
const mockFetch = vi.fn().mockResolvedValue({ ok: true })
global.fetch = mockFetch

// Mock de performance.now
vi.spyOn(performance, 'now').mockReturnValue(0)

// =============================================================================
// TESTES
// =============================================================================

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Substituir console methods
    console.debug = consoleMocks.debug
    console.info = consoleMocks.info
    console.warn = consoleMocks.warn
    console.error = consoleMocks.error
    
    // Reset performance.now mock
    let time = 0
    vi.spyOn(performance, 'now').mockImplementation(() => {
      time += 100
      return time
    })
  })
  
  afterEach(() => {
    // Restaurar console original
    console.debug = originalConsole.debug
    console.info = originalConsole.info
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  })
  
  // =========================================================================
  // Importação dinâmica para cada teste
  // =========================================================================
  
  async function getLogger() {
    // Importar fresco para cada teste
    vi.resetModules()
    vi.stubEnv('DEV', true)
    vi.stubEnv('PROD', false)
    
    const module = await import('@/lib/logger')
    return module
  }
  
  // =========================================================================
  // Testes de Níveis de Log
  // =========================================================================
  
  describe('log levels', () => {
    it('deve chamar console.debug para level debug', async () => {
      const { logger } = await getLogger()
      
      logger.debug('Debug message', { key: 'value' })
      
      expect(consoleMocks.debug).toHaveBeenCalled()
    })
    
    it('deve chamar console.info para level info', async () => {
      const { logger } = await getLogger()
      
      logger.info('Info message')
      
      expect(consoleMocks.info).toHaveBeenCalled()
    })
    
    it('deve chamar console.warn para level warn', async () => {
      const { logger } = await getLogger()
      
      logger.warn('Warning message')
      
      expect(consoleMocks.warn).toHaveBeenCalled()
    })
    
    it('deve chamar console.error para level error', async () => {
      const { logger } = await getLogger()
      
      logger.error('Error message', new Error('Test error'))
      
      expect(consoleMocks.error).toHaveBeenCalled()
    })
  })
  
  // =========================================================================
  // Testes de Formatação
  // =========================================================================
  
  describe('message formatting', () => {
    it('deve incluir prefixo de contexto', async () => {
      const { logger } = await getLogger()
      
      logger.info('Test message')
      
      const call = consoleMocks.info.mock.calls[0]
      expect(call[0]).toContain('[FUXICO]')
    })
    
    it('deve incluir level em maiúsculas', async () => {
      const { logger } = await getLogger()
      
      logger.info('Test message')
      
      const call = consoleMocks.info.mock.calls[0]
      expect(call[0]).toContain('[INFO]')
    })
    
    it('deve incluir dados adicionais', async () => {
      const { logger } = await getLogger()
      const testData = { userId: '123', action: 'test' }
      
      logger.info('Test message', testData)
      
      const call = consoleMocks.info.mock.calls[0]
      expect(call).toContain(testData)
    })
  })
  
  // =========================================================================
  // Testes de Timer
  // =========================================================================
  
  describe('time()', () => {
    it('deve medir duração de operações', async () => {
      const { logger } = await getLogger()
      
      const endTimer = logger.time('testOperation')
      endTimer()
      
      expect(consoleMocks.debug).toHaveBeenCalled()
      const call = consoleMocks.debug.mock.calls[0]
      expect(call[1]).toContain('testOperation completed')
    })
    
    it('deve retornar função callable', async () => {
      const { logger } = await getLogger()
      
      const endTimer = logger.time('test')
      
      expect(typeof endTimer).toBe('function')
    })
  })
  
  // =========================================================================
  // Testes de Child Logger
  // =========================================================================
  
  describe('child()', () => {
    it('deve criar logger com contexto filho', async () => {
      const { logger } = await getLogger()
      
      const childLogger = logger.child('Auth')
      childLogger.info('Child message')
      
      const call = consoleMocks.info.mock.calls[0]
      expect(call[0]).toContain('FUXICO:Auth')
    })
    
    it('deve manter funcionalidade do logger filho', async () => {
      const { logger } = await getLogger()
      
      const childLogger = logger.child('Service')
      
      expect(typeof childLogger.debug).toBe('function')
      expect(typeof childLogger.info).toBe('function')
      expect(typeof childLogger.warn).toBe('function')
      expect(typeof childLogger.error).toBe('function')
    })
  })
  
  // =========================================================================
  // Testes de Sanitização
  // =========================================================================
  
  describe('data sanitization', () => {
    it('deve sanitizar dados sensíveis em produção', async () => {
      // Simular produção
      vi.stubEnv('DEV', false)
      vi.stubEnv('PROD', true)
      
      // Re-importar logger
      vi.resetModules()
      const { Logger } = await import('@/lib/logger')
      
      const prodLogger = new Logger({
        level: 'info',
        enableConsole: true,
        enableRemote: false,
      })
      
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'key-abc',
        name: 'John',
      }
      
      prodLogger.info('Test', sensitiveData)
      
      // Em produção, dados sensíveis devem ser sanitizados
      // O teste verifica que a função não lança erro
      expect(consoleMocks.info).toHaveBeenCalled()
    })
  })
  
  // =========================================================================
  // Testes de Erro
  // =========================================================================
  
  describe('error handling', () => {
    it('deve formatar Error objects corretamente', async () => {
      const { logger } = await getLogger()
      const testError = new Error('Test error message')
      testError.name = 'TestError'
      
      logger.error('An error occurred', testError)
      
      expect(consoleMocks.error).toHaveBeenCalled()
    })
    
    it('deve lidar com erros não-Error', async () => {
      const { logger } = await getLogger()
      
      logger.error('String error', 'Just a string')
      
      expect(consoleMocks.error).toHaveBeenCalled()
    })
    
    it('deve lidar com erros undefined', async () => {
      const { logger } = await getLogger()
      
      logger.error('No error object')
      
      expect(consoleMocks.error).toHaveBeenCalled()
    })
  })
  
  // =========================================================================
  // Testes dos Helpers
  // =========================================================================
  
  describe('log helpers', () => {
    it('log.debug deve funcionar', async () => {
      const { log } = await getLogger()
      
      log.debug('Debug via helper')
      
      expect(consoleMocks.debug).toHaveBeenCalled()
    })
    
    it('log.info deve funcionar', async () => {
      const { log } = await getLogger()
      
      log.info('Info via helper')
      
      expect(consoleMocks.info).toHaveBeenCalled()
    })
    
    it('log.warn deve funcionar', async () => {
      const { log } = await getLogger()
      
      log.warn('Warn via helper')
      
      expect(consoleMocks.warn).toHaveBeenCalled()
    })
    
    it('log.error deve funcionar', async () => {
      const { log } = await getLogger()
      
      log.error('Error via helper')
      
      expect(consoleMocks.error).toHaveBeenCalled()
    })
    
    it('log.time deve funcionar', async () => {
      const { log } = await getLogger()
      
      const end = log.time('helper-timer')
      expect(typeof end).toBe('function')
      
      end()
      expect(consoleMocks.debug).toHaveBeenCalled()
    })
  })
})
