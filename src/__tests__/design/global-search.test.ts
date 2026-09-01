// =============================================================================
// FUXICO - Global Search / Command Palette Tests
// Validates navigation items, categories, keywords, and quick actions
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const searchDialogContent = fs.readFileSync(
  path.resolve(__dirname, '../../components/dashboard/GlobalSearchDialog.tsx'),
  'utf-8'
);

// O hook de atalhos vive em módulo próprio (requisito de Fast Refresh).
const searchHookContent = fs.readFileSync(
  path.resolve(__dirname, '../../hooks/use-global-search.ts'),
  'utf-8'
);

describe('GlobalSearchDialog - Navigation Items', () => {
  const requiredTabs = [
    'home', 'emails', 'links', 'documents', 'scheduling',
    'reports', 'analytics', 'realtime', 'geo', 'trends', 'benchmark',
    'ai-optimizer', 'leads', 'segmentation', 'followup', 'sequences',
    'campaigns', 'abtesting', 'unsubscribe', 'deliverability',
    'bouncealerts', 'push-notifications', 'notifications',
    'templates', 'featureflags', 'audit', 'users', 'config',
    'integrations', 'bitrix', 'whatsapp', 'webhooks',
  ];

  requiredTabs.forEach(tab => {
    it(`should include navigation item for tab '${tab}'`, () => {
      expect(searchDialogContent).toContain(`id: '${tab}'`);
    });
  });

  it('should have 30+ navigation items', () => {
    const matches = searchDialogContent.match(/\{ id: '/g);
    expect(matches?.length).toBeGreaterThanOrEqual(30);
  });
});

describe('GlobalSearchDialog - Categories', () => {
  const requiredCategories = [
    'Visão Geral', 'Rastreamento', 'Analytics', 'Engajamento',
    'Entregabilidade', 'Administração', 'Integrações',
  ];

  requiredCategories.forEach(category => {
    it(`should define category '${category}'`, () => {
      expect(searchDialogContent).toContain(`category: '${category}'`);
    });
  });
});

describe('GlobalSearchDialog - Labels', () => {
  const requiredLabels = [
    'Início', 'Emails Rastreados', 'Links Rastreados', 'Documentos',
    'Relatórios', 'Tempo Real', 'Geo Analytics', 'Tendências',
    'Lead Scoring', 'Follow-up', 'Sequências', 'Campanhas',
    'Teste A/B', 'Reputação', 'Auditoria', 'Webhooks',
  ];

  requiredLabels.forEach(label => {
    it(`should have label '${label}'`, () => {
      expect(searchDialogContent).toContain(`label: '${label}'`);
    });
  });
});

describe('GlobalSearchDialog - Keywords', () => {
  const keywordSamples = [
    'dashboard', 'email', 'tracking', 'link', 'url', 'documento',
    'analytics', 'realtime', 'geo', 'tendencia', 'lead', 'automacao',
    'campanha', 'webhook', 'template', 'auditoria', 'whatsapp',
    'bitrix', 'crm', 'segmento', 'bounce', 'push', 'notificacao',
  ];

  keywordSamples.forEach(keyword => {
    it(`should include keyword '${keyword}'`, () => {
      expect(searchDialogContent).toContain(`'${keyword}'`);
    });
  });
});

describe('GlobalSearchDialog - Quick Actions', () => {
  it('should define new-tracking quick action', () => {
    expect(searchDialogContent).toContain("id: 'new-tracking'");
  });

  it('should define shortcuts quick action', () => {
    expect(searchDialogContent).toContain("id: 'shortcuts'");
  });

  it('should show Alt+N shortcut for new tracking', () => {
    expect(searchDialogContent).toContain("shortcut: 'Alt+N'");
  });
});

describe('GlobalSearchDialog - Keyboard Shortcuts', () => {
  it('should support Alt+F shortcut', () => {
    expect(searchHookContent).toContain("e.altKey && e.key.toLowerCase() === 'f'");
  });

  it('should support Cmd/Ctrl+K shortcut', () => {
    expect(searchHookContent).toContain("e.metaKey || e.ctrlKey");
    expect(searchHookContent).toContain("e.key.toLowerCase() === 'k'");
  });
});

describe('GlobalSearchDialog - Recent Searches', () => {
  it('should support localStorage for recent searches', () => {
    expect(searchDialogContent).toContain('fuxico-recent-searches');
  });

  it('should limit recent searches to 5', () => {
    expect(searchDialogContent).toContain('.slice(0, 5)');
  });

  it('should have clear recent searches functionality', () => {
    expect(searchDialogContent).toContain('clearRecentSearches');
  });
});

describe('GlobalSearchDialog - UI Elements', () => {
  it('should show keyboard navigation hints in footer', () => {
    expect(searchDialogContent).toContain('selecionar');
    expect(searchDialogContent).toContain('navegar');
    expect(searchDialogContent).toContain('fechar');
  });

  it('should show empty state message', () => {
    expect(searchDialogContent).toContain('Nenhum resultado encontrado');
  });

  it('should use debounced search', () => {
    expect(searchDialogContent).toContain('useDebouncedValue');
  });

  it('should use memo for performance', () => {
    expect(searchDialogContent).toContain('memo(GlobalSearchDialogBase)');
  });

  it('should use useMemo for filtered items', () => {
    expect(searchDialogContent).toContain('useMemo');
  });

  it('should use useCallback for handlers', () => {
    expect(searchDialogContent).toContain('useCallback');
  });
});

describe('GlobalSearchDialog - Icons', () => {
  const requiredIcons = [
    'Home', 'Mail', 'Link2', 'FileText', 'BarChart3', 'Calendar',
    'MapPin', 'Zap', 'Target', 'Users', 'MessageSquare', 'Layout',
    'UserMinus', 'Shield', 'Bell', 'Settings', 'Globe', 'Webhook',
  ];

  requiredIcons.forEach(icon => {
    it(`should import ${icon} icon`, () => {
      expect(searchDialogContent).toContain(icon);
    });
  });
});
