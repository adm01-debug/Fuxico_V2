import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('landing page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('login page screenshot', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('dark mode landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Toggle dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('landing-page-dark.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });

  test('mobile viewport screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing-mobile.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
