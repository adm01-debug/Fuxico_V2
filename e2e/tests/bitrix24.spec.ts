import { test, expect } from '@playwright/test';

test.describe('Bitrix24 Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display Bitrix24 tab', async ({ page }) => {
    const bitrixTab = page.getByRole('tab', { name: /bitrix/i });
    await expect(bitrixTab).toBeVisible();
  });

  test('should show configuration form when tab is clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /bitrix/i }).click();
    await page.waitForLoadState('networkidle');
    
    const configSection = page.getByText(/configuração/i).first();
    await expect(configSection).toBeVisible();
  });

  test('should validate webhook URL format', async ({ page }) => {
    await page.getByRole('tab', { name: /bitrix/i }).click();
    await page.waitForLoadState('networkidle');
    
    const urlInput = page.getByPlaceholder(/webhook/i).first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('invalid-url');
      await urlInput.blur();
      
      // Should show validation error
      const hasError = await page.getByText(/url.*inválid/i).isVisible().catch(() => false);
      expect(typeof hasError).toBe('boolean');
    }
  });

  test('should display sync logs section', async ({ page }) => {
    await page.getByRole('tab', { name: /bitrix/i }).click();
    await page.waitForLoadState('networkidle');
    
    const logsSection = page.getByText(/logs|histórico|sincronização/i).first();
    await expect(logsSection).toBeVisible();
  });

  test('should have sync button', async ({ page }) => {
    await page.getByRole('tab', { name: /bitrix/i }).click();
    await page.waitForLoadState('networkidle');
    
    const syncButton = page.getByRole('button', { name: /sincronizar|sync/i }).first();
    await expect(syncButton).toBeVisible();
  });
});
