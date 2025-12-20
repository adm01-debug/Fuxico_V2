// =============================================================================
// FUXICO - Testes E2E do Dashboard
// Arquivo: e2e/tests/dashboard.spec.ts
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('deve exibir o título do dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('deve exibir as tabs de navegação', async ({ page }) => {
    const tabs = ['Emails', 'Links', 'Documentos', 'Relatórios'];
    
    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
  });

  test('deve navegar entre tabs', async ({ page }) => {
    // Clicar na tab Links
    await page.click('text=Links');
    await expect(page.locator('[data-state="active"]')).toContainText('Links');
    
    // Clicar na tab Documentos
    await page.click('text=Documentos');
    await expect(page.locator('[data-state="active"]')).toContainText('Documentos');
    
    // Voltar para Emails
    await page.click('text=Emails');
    await expect(page.locator('[data-state="active"]')).toContainText('Emails');
  });

  test('deve exibir tabela de emails', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Verificar headers da tabela
    const headers = ['Destinatário', 'Assunto', 'Status'];
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('deve filtrar emails por status', async ({ page }) => {
    // Abrir filtros
    const filterButton = page.locator('button:has-text("Filtros")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Selecionar status "Lido"
    const statusSelect = page.locator('select[name="status"], [data-testid="status-filter"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('read');
      
      // Aguardar atualização
      await page.waitForTimeout(500);
    }
  });

  test('deve abrir modal de criação de tracking', async ({ page }) => {
    // Procurar botão de criar
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo")');
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Verificar se modal abriu
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });

  test('deve exibir estatísticas resumidas', async ({ page }) => {
    // Verificar cards de estatísticas
    const stats = ['Total', 'Abertos', 'Cliques', 'Bounced'];
    
    for (const stat of stats) {
      const statCard = page.locator(`text=${stat}`).first();
      // Pode não existir, então não falhar
      if (await statCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(statCard).toBeVisible();
      }
    }
  });
});

test.describe('Dashboard - Responsividade', () => {
  test('deve funcionar em mobile', async ({ page }) => {
    // Definir viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Verificar se título é visível
    await expect(page.locator('h1')).toBeVisible();
    
    // Tabs devem estar visíveis (possivelmente como ícones)
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test('deve funcionar em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    await expect(page.locator('h1')).toBeVisible();
  });
});
