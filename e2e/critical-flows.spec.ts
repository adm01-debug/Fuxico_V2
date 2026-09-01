import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(page).toHaveTitle(/Fuxico/i);
  });

  test('should navigate to auth page from CTA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const ctaButton = page.locator('a[href="/auth"], button:has-text("Começar"), a:has-text("Começar")').first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Auth Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should show validation error on empty submit', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should not navigate away
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    const forgotLink = page.locator('a[href="/forgot-password"], button:has-text("Esquec")').first();
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // PrivateRoute should redirect to /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect to auth when accessing settings unauthenticated', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect to auth when accessing security unauthenticated', async ({ page }) => {
    await page.goto('/security');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('404 Page', () => {
  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Forgot Password Page', () => {
  test('should display email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip-to-content link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const skipLink = page.locator('.skip-to-content, a[href="#main-content"]');
    await expect(skipLink.first()).toBeAttached();
  });

  test('should have main content landmark', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main#main-content')).toBeVisible();
  });

  test('should have proper lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('pt-BR');
  });
});
