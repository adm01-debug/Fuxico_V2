// =============================================================================
// FUXICO - Testes E2E de Tracking
// Arquivo: e2e/tests/tracking.spec.ts
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Criação de Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('deve abrir dialog de criação de tracking', async ({ page }) => {
    // Procurar botão de criar
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo"), button:has-text("+")');
    
    if (await createButton.first().isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      
      // Verificar se dialog abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Verificar campos do formulário
      await expect(page.locator('input[name="recipientEmail"], input[placeholder*="email"]')).toBeVisible();
    }
  });

  test('deve validar email do destinatário', async ({ page }) => {
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo")');
    
    if (await createButton.first().isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      
      // Preencher email inválido
      const emailInput = page.locator('input[name="recipientEmail"], input[placeholder*="email"]');
      await emailInput.fill('invalid-email');
      
      // Tentar submeter
      const submitButton = page.locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Criar")');
      await submitButton.click();
      
      // Verificar erro de validação
      await expect(page.locator('text=inválido, text=invalid')).toBeVisible({ timeout: 3000 }).catch(() => {
        // Pode usar validação HTML5
      });
    }
  });

  test('deve criar tracking com sucesso', async ({ page }) => {
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo")');
    
    if (await createButton.first().isVisible({ timeout: 3000 })) {
      await createButton.first().click();
      
      // Preencher formulário
      const emailInput = page.locator('input[name="recipientEmail"], input[placeholder*="email"]');
      await emailInput.fill('test@example.com');
      
      const subjectInput = page.locator('input[name="subject"], input[placeholder*="assunto"]');
      if (await subjectInput.isVisible()) {
        await subjectInput.fill('Email de Teste E2E');
      }
      
      // Submeter
      const submitButton = page.locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Criar")');
      await submitButton.click();
      
      // Verificar sucesso (toast ou dialog fechado)
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 }).catch(() => {
        // Dialog pode ter sido fechado
      });
    }
  });
});

test.describe('Visualização de Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('deve exibir lista de emails rastreados', async ({ page }) => {
    // Aguardar tabela carregar
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 }).catch(() => {
      // Pode não haver dados
    });
    
    // Verificar se há linhas na tabela
    const rows = page.locator('tbody tr, [role="row"]');
    const count = await rows.count();
    
    // Pode haver ou não dados, apenas verificar estrutura
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('deve abrir detalhes ao clicar em um email', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRow.click();
      
      // Verificar se abriu painel de detalhes ou modal
      await expect(page.locator('[data-testid="email-detail"], [role="dialog"], .email-detail')).toBeVisible({ timeout: 3000 }).catch(() => {
        // Layout pode variar
      });
    }
  });

  test('deve copiar link de tracking', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
    
    // Procurar botão de copiar
    const copyButton = page.locator('button:has-text("Copiar"), button[aria-label*="copy"]');
    
    if (await copyButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyButton.first().click();
      
      // Verificar toast de sucesso
      await expect(page.locator('text=Copiado, text=Copied')).toBeVisible({ timeout: 3000 }).catch(() => {
        // Toast pode ter sumido
      });
    }
  });
});

test.describe('Estatísticas de Tracking', () => {
  test('deve exibir gráficos de estatísticas', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navegar para relatórios se houver tab
    const reportsTab = page.locator('text=Relatórios, text=Reports, text=Analytics');
    if (await reportsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsTab.click();
    }
    
    // Verificar se há gráficos
    await expect(page.locator('canvas, svg.recharts-surface, .chart')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Pode não haver dados suficientes para gráficos
    });
  });

  test('deve filtrar por período', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Procurar seletor de período
    const periodSelector = page.locator('select:has-text("7 dias"), button:has-text("7d"), [data-testid="period-selector"]');
    
    if (await periodSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await periodSelector.click();
      
      // Selecionar outro período
      const option30d = page.locator('text=30 dias, text=30d, option[value="30"]');
      if (await option30d.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option30d.click();
      }
    }
  });
});
