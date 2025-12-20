// =============================================================================
// FUXICO - Configuração Vitest
// Arquivo: vitest.config.ts
// Descrição: Configuração completa para testes unitários e de integração
// =============================================================================

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Ambiente para testes de componentes React
    environment: 'jsdom',
    
    // Setup global antes dos testes
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Padrões de arquivos de teste
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    
    // Ignorar
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'supabase/functions/**',
    ],
    
    // Globals (describe, it, expect sem import)
    globals: true,
    
    // Configuração de coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Arquivos para cobrir
      include: [
        'src/**/*.{ts,tsx}',
      ],
      
      // Arquivos para ignorar no coverage
      exclude: [
        'src/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/components/ui/**', // shadcn components
      ],
      
      // Thresholds mínimos
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
    
    // Timeout para testes
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Pool de workers
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    
    // Retry para testes flaky
    retry: 2,
    
    // Reporters
    reporters: ['default', 'html'],
    
    // Output directory para relatórios HTML
    outputFile: {
      html: './test-results/index.html',
    },
    
    // Mocks automáticos
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Watch mode
    watch: false,
    
    // Deps
    deps: {
      inline: [
        '@radix-ui',
        'class-variance-authority',
      ],
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
