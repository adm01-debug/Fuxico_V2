// =============================================================================
// FUXICO - Component Architecture & Best Practices Tests
// Validates code quality patterns, imports, exports, memoization
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readComponent(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../', relativePath), 'utf-8');
}

describe('ErrorBoundary', () => {
  const content = readComponent('components/ErrorBoundary.tsx');

  it('should exist', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('should implement componentDidCatch or getDerivedStateFromError', () => {
    expect(
      content.includes('componentDidCatch') || content.includes('getDerivedStateFromError')
    ).toBe(true);
  });
});

describe('Landing Page Components', () => {
  const landingComponents = [
    'landing/HeroSection.tsx',
    'landing/FeaturesSection.tsx',
    'landing/BenefitsSection.tsx',
    'landing/CTASection.tsx',
    'landing/FooterSection.tsx',
    'landing/HeaderSection.tsx',
    'landing/HowItWorksSection.tsx',
    'landing/TestimonialsSection.tsx',
    'landing/StatsSection.tsx',
  ];

  landingComponents.forEach(comp => {
    it(`should have ${comp}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../components/', comp));
      expect(exists).toBe(true);
    });
  });
});

describe('Auth Components', () => {
  const authComponents = ['auth/LoginForm.tsx', 'auth/SignupForm.tsx', 'auth/AuthHeader.tsx'];

  authComponents.forEach(comp => {
    it(`should have ${comp}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../components/', comp));
      expect(exists).toBe(true);
    });
  });
});

describe('UI Components', () => {
  const uiComponents = [
    'ui/button.tsx', 'ui/card.tsx', 'ui/dialog.tsx', 'ui/badge.tsx',
    'ui/input.tsx', 'ui/select.tsx', 'ui/tabs.tsx', 'ui/tooltip.tsx',
    'ui/skeleton.tsx', 'ui/toast.tsx', 'ui/sonner.tsx', 'ui/sidebar.tsx',
    'ui/accordion.tsx', 'ui/alert.tsx', 'ui/checkbox.tsx', 'ui/form.tsx',
    'ui/progress.tsx', 'ui/switch.tsx', 'ui/table.tsx', 'ui/textarea.tsx',
    'ui/scroll-area.tsx', 'ui/separator.tsx', 'ui/popover.tsx',
    'ui/dropdown-menu.tsx', 'ui/command.tsx', 'ui/breadcrumb.tsx',
    'ui/empty-state.tsx', 'ui/email-status-badge.tsx',
    'ui/password-strength-indicator.tsx', 'ui/tooltip-wrapper.tsx',
    'ui/gamification.tsx', 'ui/confetti.tsx', 'ui/mode-toggle.tsx',
    'ui/scroll-indicator.tsx',
  ];

  uiComponents.forEach(comp => {
    it(`should have ${comp}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../components/', comp));
      expect(exists).toBe(true);
    });
  });
});

describe('Dashboard Components', () => {
  const dashboardComponents = [
    'dashboard/DashboardHome.tsx',
    'dashboard/DashboardLayout.tsx',
    'dashboard/DashboardSidebar.tsx',
    'dashboard/DashboardBreadcrumbs.tsx',
    'dashboard/EmailTable.tsx',
    'dashboard/EmailFilters.tsx',
    'dashboard/GlobalSearchDialog.tsx',
    'dashboard/KeyboardShortcutsDialog.tsx',
    'dashboard/NotificationCenter.tsx',
    'dashboard/MobileBottomNav.tsx',
    'dashboard/QuickActions.tsx',
    'dashboard/TabSkeleton.tsx',
    'dashboard/ConfirmDialog.tsx',
    'dashboard/ExportDialog.tsx',
    'dashboard/CreateTrackingDialog.tsx',
  ];

  dashboardComponents.forEach(comp => {
    it(`should have ${comp}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../components/', comp));
      expect(exists).toBe(true);
    });
  });
});

describe('Security Components', () => {
  const securityComponents = [
    'SecurityDashboard.tsx',
    'ActiveSessionsList.tsx',
    'BlockedIPsPanel.tsx',
    'IPWhitelistPanel.tsx',
    'MFASettingsPanel.tsx',
    'SecurityAlertsList.tsx',
    'SecurityEventsList.tsx',
    'SecurityOverviewCards.tsx',
  ];

  securityComponents.forEach(comp => {
    it(`should have features/security/components/${comp}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../features/security/components/', comp));
      expect(exists).toBe(true);
    });
  });
});

describe('Hooks Architecture', () => {
  // Feature-based hooks live under src/features/<domain>/hooks/
  const featureHooks: Array<[string, string]> = [
    ['features/tracking/hooks', 'use-tracking.ts'],
    ['features/security/hooks', 'use-user-roles.ts'],
  ];

  // Cross-cutting hooks remain under src/hooks/
  const sharedHooks = [
    'use-saved-filters.ts',
    'use-debounced-value.ts',
    'use-local-storage.ts',
    'use-online-status.ts',
    'use-media-query.ts',
    'use-keyboard-navigation.ts',
    'use-realtime-notifications.ts',
    'use-bounce-alerts.ts',
    'use-lead-scoring.ts',
    'use-campaigns.ts',
    'use-feature-flags.ts',
    'use-geo-stats.ts',
    'use-deliverability.ts',
    'use-tracked-links.ts',
    'use-tracked-documents.ts',
    'use-ab-tests.ts',
    'use-webhook.ts',
    'use-fulltext-search.ts',
    'use-trend-prediction.ts',
    'use-virtual-list.ts',
    'use-tab-badge.ts',
    'use-desktop-notifications.ts',
    'use-prefetch-route.ts',
  ];

  featureHooks.forEach(([dir, file]) => {
    it(`should have ${dir}/${file}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../', dir, file));
      expect(exists).toBe(true);
    });
  });

  sharedHooks.forEach(hook => {
    it(`should have hooks/${hook}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../hooks/', hook));
      expect(exists).toBe(true);
    });
  });
});

describe('Context Providers', () => {
  const content = readComponent('contexts/AuthContext.tsx');

  it('AuthContext should exist', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('should export useAuth hook', () => {
    expect(content).toContain('useAuth');
  });

  it('should provide user state', () => {
    expect(content).toContain('user');
  });
});

describe('i18n Support', () => {
  const locales = ['en.json', 'es.json', 'pt-BR.json'];

  locales.forEach(locale => {
    it(`should have locale file ${locale}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../i18n/locales/', locale));
      expect(exists).toBe(true);
    });
  });

  it('should have i18n configuration', () => {
    const exists = fs.existsSync(path.resolve(__dirname, '../../i18n/index.ts'));
    expect(exists).toBe(true);
  });
});

describe('Pages', () => {
  const pages = [
    'pages/Index.tsx', 'pages/Auth.tsx', 'pages/Dashboard.tsx',
    'pages/Settings.tsx', 'pages/Security.tsx', 'pages/Pricing.tsx',
    'pages/NotFound.tsx', 'pages/ForgotPassword.tsx', 'pages/ResetPassword.tsx',
    'pages/VerifyEmail.tsx', 'pages/TwoFactorAuth.tsx', 'pages/MFAVerify.tsx',
    'pages/Roles.tsx', 'pages/Permissions.tsx',
  ];

  pages.forEach(page => {
    it(`should have ${page}`, () => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../', page));
      expect(exists).toBe(true);
    });
  });
});
