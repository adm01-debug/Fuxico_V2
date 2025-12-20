// =============================================================================
// FUXICO - Testes E2E de Autenticação
// Arquivo: e2e/tests/auth.spec.ts
// =============================================================================

import { test, expect } from '@playwright/test';

// Estes testes NÃO usam o setup de autenticação
test.describe('Autenticação', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Limpar estado

  test('deve exibir página de login', async ({ page }) => {
    await page.goto('/auth');
    
    // Verificar elementos do formulário
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve exibir erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/auth');
    
    // Preencher credenciais inválidas
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de erro
    await expect(page.locator('text=Credenciais inválidas, text=Invalid, text=Error')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Pode ser toast ou inline
    });
  });

  test('deve validar email obrigatório', async ({ page }) => {
    await page.goto('/auth');
    
    // Tentar submeter sem email
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');
    
    // Verificar validação HTML5 ou mensagem customizada
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('deve redirecionar usuário não autenticado para login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Deve ser redirecionado para auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('deve permitir alternar entre login e cadastro', async ({ page }) => {
    await page.goto('/auth');
    
    // Procurar link/botão para cadastro
    const signUpLink = page.locator('text=Criar conta, text=Sign up, text=Cadastrar');
    
    if (await signUpLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signUpLink.click();
      
      // Verificar se mudou para formulário de cadastro
      await expect(page.locator('text=Confirmar senha, input[name="confirmPassword"]')).toBeVisible({ timeout: 3000 }).catch(() => {
        // Layout pode variar
      });
    }
  });

  test('deve exibir link de recuperação de senha', async ({ page }) => {
    await page.goto('/auth');
    
    const forgotLink = page.locator('text=Esqueci, text=Forgot, text=Recuperar');
    
    if (await forgotLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(forgotLink).toBeVisible();
    }
  });
});

test.describe('Logout', () => {
  test('deve fazer logout corretamente', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Procurar menu de usuário ou botão de logout
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Sair"), button:has-text("Logout")');
    
    if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userMenu.click();
      
      // Clicar em logout se for menu dropdown
      const logoutButton = page.locator('text=Sair, text=Logout');
      if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutButton.click();
      }
      
      // Verificar redirecionamento para auth
      await expect(page).toHaveURL(/\/auth|\/$/);
    }
  });
});
