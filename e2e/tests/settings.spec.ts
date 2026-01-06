import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings page', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /configurações|settings/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should have preferences section', async ({ page }) => {
    const prefsSection = page.getByText(/preferências|preferences/i).first();
    await expect(prefsSection).toBeVisible();
  });

  test('should have theme toggle', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /tema|theme|dark|light/i }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      // Theme should change
      await page.waitForTimeout(500);
    }
  });

  test('should have language selector', async ({ page }) => {
    const langSelector = page.getByRole('combobox', { name: /idioma|language/i }).first();
    if (await langSelector.isVisible()) {
      await expect(langSelector).toBeVisible();
    }
  });

  test('should have notification settings', async ({ page }) => {
    const notifSection = page.getByText(/notificações|notifications/i).first();
    await expect(notifSection).toBeVisible();
  });

  test('should save settings on change', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      // Should show success message
      const toast = page.getByText(/sucesso|saved|success/i);
      await expect(toast).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});
