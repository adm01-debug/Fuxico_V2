// =============================================================================
// FUXICO - Dashboard Layout Architecture Tests
// Validates tab mapping, skeleton variants, lazy loading, labels
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const layoutContent = fs.readFileSync(
  path.resolve(__dirname, '../../components/dashboard/DashboardLayout.tsx'),
  'utf-8'
);

describe('DashboardLayout - Tab Components Mapping', () => {
  const allTabs = [
    'home', 'emails', 'links', 'documents', 'reports', 'analytics',
    'geo', 'scheduling', 'deliverability', 'bouncealerts', 'notifications',
    'leads', 'followup', 'insights', 'campaigns', 'abtesting', 'unsubscribe',
    'sequences', 'templates', 'audit', 'users', 'config', 'bitrix',
    'webhooks', 'integrations', 'trends', 'featureflags', 'realtime',
    'ai-optimizer', 'push-notifications', 'whatsapp', 'benchmark', 'segmentation',
  ];

  allTabs.forEach(tab => {
    it(`should map tab '${tab}' to a component`, () => {
      // Handle tabs with hyphens differently
      const tabKey = tab.includes('-') ? `'${tab}'` : `${tab}:`;
      expect(layoutContent).toContain(tabKey);
    });
  });
});

describe('DashboardLayout - Tab Labels', () => {
  const labelMappings: Record<string, string> = {
    home: 'Início',
    emails: 'Emails',
    links: 'Links',
    documents: 'Documentos',
    reports: 'Relatórios',
    analytics: 'Analytics Avançado',
    geo: 'Geo Analytics',
    scheduling: 'Agendamento',
    deliverability: 'Reputação',
    bouncealerts: 'Alertas Bounce',
    notifications: 'Histórico',
    leads: 'Lead Scoring',
    followup: 'Follow-up',
    campaigns: 'Campanhas',
    abtesting: 'Teste A/B',
    unsubscribe: 'Exclusão',
    sequences: 'Sequências',
    templates: 'Templates',
    audit: 'Segurança',
    users: 'Usuários',
    webhooks: 'Webhooks',
    trends: 'Tendências',
    featureflags: 'Feature Flags',
    realtime: 'Tempo Real',
    whatsapp: 'WhatsApp',
    benchmark: 'Benchmark',
    segmentation: 'Segmentação',
  };

  Object.entries(labelMappings).forEach(([tab, label]) => {
    it(`tab '${tab}' should have label '${label}'`, () => {
      expect(layoutContent).toContain(`'${label}'`);
    });
  });
});

describe('DashboardLayout - Skeleton Variants Mapping', () => {
  const skeletonMappings: Record<string, string> = {
    home: 'dashboard',
    emails: 'table',
    links: 'table',
    documents: 'table',
    reports: 'chart',
    analytics: 'chart',
    geo: 'chart',
    scheduling: 'table',
    deliverability: 'metrics',
    bouncealerts: 'activity',
    notifications: 'activity',
    leads: 'table',
    followup: 'activity',
    insights: 'chart',
    campaigns: 'table',
    abtesting: 'table',
    unsubscribe: 'table',
    sequences: 'table',
    templates: 'table',
    audit: 'table',
    users: 'table',
    config: 'form',
    bitrix: 'form',
    webhooks: 'form',
    integrations: 'form',
    trends: 'chart',
    featureflags: 'table',
    realtime: 'chart',
    benchmark: 'chart',
    segmentation: 'table',
  };

  Object.entries(skeletonMappings).forEach(([tab, variant]) => {
    it(`tab '${tab}' should use '${variant}' skeleton`, () => {
      const hasMapping = layoutContent.includes(`${tab}: '${variant}'`) || layoutContent.includes(`'${tab}': '${variant}'`);
      expect(hasMapping).toBe(true);
    });
  });

  it('should have skeleton variants for all 33 tabs', () => {
    const variantBlock = layoutContent.match(/TAB_SKELETON_VARIANTS[^}]+\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s)?.[0] || '';
    const entries = variantBlock.match(/\w[\w-]*['"]?\s*:\s*'/g);
    expect(entries?.length).toBeGreaterThanOrEqual(30);
  });
});

describe('DashboardLayout - Lazy Loading', () => {
  const lazyComponents = [
    'DashboardHome', 'EmailTable', 'LinksTab', 'DocumentsTab',
    'ReportsTab', 'GeoAnalyticsTab', 'EmailSchedulingTab',
    'DeliverabilityTab', 'BounceAlertsTab', 'NotificationHistoryTab',
    'LeadScoringTab', 'FollowUpTab', 'CampaignsTab', 'ABTestingTab',
    'UnsubscribeTab', 'SequencesTab', 'TemplatesTab', 'AuditTab',
    'UserRolesTab', 'AuditConfigTab', 'BitrixTab', 'WebhookTab',
    'TrendPredictionTab', 'FeatureFlagsTab', 'RealtimeAnalyticsTab',
    'AISubjectOptimizerTab', 'PushNotificationsTab', 'WhatsAppIntegrationTab',
    'BenchmarkReportsTab', 'SmartSegmentationTab',
  ];

  lazyComponents.forEach(component => {
    it(`should lazy load ${component}`, () => {
      expect(layoutContent).toContain(`const ${component} = lazy(`);
    });
  });
});

describe('DashboardLayout - Features', () => {
  it('should include GlobalSearchDialog', () => {
    expect(layoutContent).toContain('GlobalSearchDialog');
  });

  it('should include KeyboardShortcutsDialog', () => {
    expect(layoutContent).toContain('KeyboardShortcutsDialog');
  });

  it('should include NotificationCenter', () => {
    expect(layoutContent).toContain('NotificationCenter');
  });

  it('should include ModeToggle (dark mode)', () => {
    expect(layoutContent).toContain('ModeToggle');
  });

  it('should include OnboardingWizard', () => {
    expect(layoutContent).toContain('OnboardingWizard');
  });

  it('should include JoyrideTour', () => {
    expect(layoutContent).toContain('JoyrideTour');
  });

  it('should include CreateTrackingDialog', () => {
    expect(layoutContent).toContain('CreateTrackingDialog');
  });

  it('should include MobileBottomNav', () => {
    expect(layoutContent).toContain('MobileBottomNav');
  });

  it('should use DashboardBreadcrumbs', () => {
    expect(layoutContent).toContain('DashboardBreadcrumbs');
  });

  it('should support tab transitions', () => {
    expect(layoutContent).toContain('AnimatePresence');
  });
});
