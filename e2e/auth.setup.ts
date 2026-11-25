// =============================================================================
// FUXICO - Setup de Autenticação para Testes E2E
// Arquivo: e2e/auth.setup.ts
// =============================================================================

import { test as setup, expect } from '@playwright/test';
import path from 'path';

// package.json tem "type": "module", entao __dirname nao existe aqui (o arquivo
// nem carregava: "ReferenceError: __dirname is not defined"). O caminho relativo
// e o mesmo de `use.storageState` no playwright.config.ts.
const authFile = path.join(process.cwd(), 'e2e/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navegar para página de login
  await page.goto('/auth');
  
  // Aguardar formulário carregar
  await page.waitForSelector('input[type="email"]');
  
  // Preencher credenciais de teste
  // NOTA: Usar variáveis de ambiente em CI
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@fuxico.app';
  const testPassword = process.env.E2E_TEST_PASSWORD || 'Test@123456';
  
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  
  // Clicar em login
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento para dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
  
  // Verificar se está logado.
  // O corpo de /dashboard não contém o texto "Dashboard" (src/pages/Dashboard.tsx
  // renderiza o DashboardLayout), então o texto literal nunca aparecia; o título
  // do documento, definido por Helmet em src/pages/Dashboard.tsx, é o sinal
  // estável de que o app autenticado carregou.
  await expect(page).toHaveTitle(/Dashboard \| FUXICO/);
  
  // Salvar estado de autenticação
  await page.context().storageState({ path: authFile });
});
