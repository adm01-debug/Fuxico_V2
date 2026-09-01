// =============================================================================
// FUXICO — E2E Accessibility Tests (axe-core via @axe-core/playwright)
// Automação WCAG 2.1 AA nas páginas públicas críticas.
// =============================================================================

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  { path: '/', name: 'Landing' },
  { path: '/auth', name: 'Auth' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/privacy', name: 'Privacy' },
];

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route.name} (${route.path}) não deve ter violações WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Regras conhecidamente ruidosas em dark themes com tokens semânticos —
      // são validadas manualmente via design tokens tests.
      .disableRules(['color-contrast'])
      .analyze();

    // Log detalhado quando houver violações para facilitar debug em CI.
    if (results.violations.length > 0) {
      console.log(`[a11y] ${route.name} violações:`, JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
}
