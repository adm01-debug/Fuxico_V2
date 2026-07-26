// =============================================================================
// FUXICO - Configuração Playwright para Testes E2E
// Arquivo: playwright.config.ts
// =============================================================================

import { defineConfig, devices } from '@playwright/test';

/**
 * URL base para testes
 * @see https://playwright.dev/docs/api/class-testoptions#test-options-base-url
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  // Diretório dos testes
  testDir: './e2e/tests',
  
  // Padrão de arquivos de teste
  testMatch: '**/*.spec.ts',
  
  // Timeout por teste
  timeout: 30000,
  
  // Expectativas
  expect: {
    timeout: 5000,
  },
  
  // Execução completa em CI
  fullyParallel: true,
  
  // Falhar o build se tiver test.only em CI
  forbidOnly: !!process.env.CI,
  
  // Retry em CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'e2e/reports' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
    ['list'],
  ],
  
  // Configuração global
  use: {
    baseURL,
    
    // Trace em caso de falha
    trace: 'on-first-retry',
    
    // Screenshot em falha
    screenshot: 'only-on-failure',
    
    // Vídeo em falha
    video: 'on-first-retry',
    
    // Viewport padrão
    viewport: { width: 1280, height: 720 },
    
    // Ignorar HTTPS errors em dev
    ignoreHTTPSErrors: true,
    
    // Ação timeout
    actionTimeout: 10000,
  },

  // Projetos (browsers)
  projects: [
    // Setup - autenticação
    {
      name: 'setup',
      testMatch: /\.setup\.ts$/,
    },
    
    // Chrome Desktop
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Firefox Desktop
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Safari Desktop
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Servidor de desenvolvimento
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Diretório de output
  outputDir: 'e2e/test-results',
});
