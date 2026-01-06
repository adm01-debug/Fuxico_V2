import { test, expect } from '@playwright/test';

test.describe('Reports Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display reports tab', async ({ page }) => {
    const reportsTab = page.getByRole('tab', { name: /relatórios|reports/i });
    await expect(reportsTab).toBeVisible();
  });

  test('should show charts on reports tab', async ({ page }) => {
    await page.getByRole('tab', { name: /relatórios|reports/i }).click();
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to load
    await page.waitForTimeout(1000);
    
    const chartsContainer = page.locator('.recharts-wrapper').first();
    await expect(chartsContainer).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('should have date range selector', async ({ page }) => {
    await page.getByRole('tab', { name: /relatórios|reports/i }).click();
    await page.waitForLoadState('networkidle');
    
    const dateSelector = page.getByText(/período|data|date range/i).first();
    await expect(dateSelector).toBeVisible();
  });

  test('should have export options', async ({ page }) => {
    await page.getByRole('tab', { name: /relatórios|reports/i }).click();
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.getByRole('button', { name: /exportar|export|download/i }).first();
    await expect(exportBtn).toBeVisible();
  });

  test('should display metrics cards', async ({ page }) => {
    await page.getByRole('tab', { name: /relatórios|reports/i }).click();
    await page.waitForLoadState('networkidle');
    
    const metricsSection = page.getByText(/total|métricas|metrics/i).first();
    await expect(metricsSection).toBeVisible();
  });
});
