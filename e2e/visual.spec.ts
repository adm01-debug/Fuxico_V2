import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Sem baselines versionados em e2e/visual.spec.ts-snapshots o toHaveScreenshot
// falha sempre em CI ("snapshot doesn't exist"). Os testes ficam ativos sozinhos
// assim que os baselines forem gerados e commitados.
const hasBaselines = fs.existsSync(
  path.join(process.cwd(), 'e2e/visual.spec.ts-snapshots'),
);

test.describe('Visual Regression Tests', () => {
  // eslint-disable-next-line sonarjs/no-skipped-tests -- baselines de snapshot ainda nao versionados em e2e/visual.spec.ts-snapshots; a suite volta sozinha quando eles existirem.
  test.skip(!hasBaselines, 'Baselines de snapshot ainda nao versionados');

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
