import { test, expect } from '@playwright/test';

test.describe('Dashboard - Mocked Data', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Supabase API calls
    await page.route('**/rest/v1/tracked_emails*', async (route) => {
      const json = [
        {
          id: '1',
          tracking_id: 'track_1',
          recipient_email: 'test@example.com',
          subject: 'Teste de Virtualização 1',
          opens: 5,
          clicks: 2,
          delivery_status: 'delivered',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          tracking_id: 'track_2',
          recipient_email: 'large-list@test.com',
          subject: 'Teste de Virtualização 2',
          opens: 0,
          clicks: 0,
          delivery_status: 'sent',
          created_at: new Date().toISOString(),
        },
      ];
      // Generate 100 more items to test virtualization
      for (let i = 3; i <= 100; i++) {
        json.push({
          id: String(i),
          tracking_id: `track_${i}`,
          recipient_email: `user${i}@test.com`,
          subject: `Email de Teste ${i}`,
          opens: Math.floor(Math.random() * 10),
          clicks: Math.floor(Math.random() * 5),
          delivery_status: 'delivered',
          created_at: new Date().toISOString(),
        });
      }
      await route.fulfill({ json });
    });

    // Mock auth session
    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        json: {
          access_token: 'mock-token',
          user: { id: 'user_1', email: 'test@fuxico.app' },
        },
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display virtualized list with multiple items', async ({ page }) => {
    // Check if some items are visible
    await expect(page.locator('text=Teste de Virtualização 1')).toBeVisible();
    await expect(page.locator('text=user5@test.com')).toBeVisible();
  });

  test('should apply filters correctly', async ({ page }) => {
    // Open filters if hidden or just use the search input
    const searchInput = page.locator('input[placeholder*="Buscar..."], input[placeholder*="email ou assunto"]').first();
    await searchInput.fill('Virtualização 1');
    
    // Should only show the filtered item
    await expect(page.locator('text=Teste de Virtualização 1')).toBeVisible();
    await expect(page.locator('text=user5@test.com')).not.toBeVisible();
  });

  test('should show details when clicking an email', async ({ page }) => {
    await page.click('text=Teste de Virtualização 1');
    // Check if details are shown (assuming there's a details view or selection state)
    // The current layout might just highlight the row or open a modal
    await expect(page.locator('button.bg-primary\\/5')).toBeVisible();
  });
});
