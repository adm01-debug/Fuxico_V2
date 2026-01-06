import { test, expect } from '@playwright/test';

test.describe('Audit Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display audit tab', async ({ page }) => {
    const auditTab = page.getByRole('tab', { name: /auditoria|audit/i });
    await expect(auditTab).toBeVisible();
  });

  test('should show audit logs table', async ({ page }) => {
    await page.getByRole('tab', { name: /auditoria|audit/i }).click();
    await page.waitForLoadState('networkidle');
    
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.getByRole('tab', { name: /auditoria|audit/i }).click();
    await page.waitForLoadState('networkidle');
    
    const filterSection = page.getByText(/filtrar|filter/i).first();
    await expect(filterSection).toBeVisible();
  });

  test('should have export button', async ({ page }) => {
    await page.getByRole('tab', { name: /auditoria|audit/i }).click();
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.getByRole('button', { name: /exportar|export/i }).first();
    await expect(exportBtn).toBeVisible();
  });

  test('should show date range picker', async ({ page }) => {
    await page.getByRole('tab', { name: /auditoria|audit/i }).click();
    await page.waitForLoadState('networkidle');
    
    const datePicker = page.getByText(/data|date|período/i).first();
    await expect(datePicker).toBeVisible();
  });
});
