// =============================================================================
// FUXICO - Component: GlobalSearchDialog
// Command palette style global search with Alt+F shortcut
// =============================================================================

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  FileText, 
  Link2, 
  BarChart3, 
  Users, 
  Settings, 
  Search,
  Clock,
  Star,
  ArrowRight,
  Keyboard,
  Plus,
  Home,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Zap,
  Target,
  MessageSquare,
  UserMinus,
  Layout,
  Globe,
  Webhook,
} from 'lucide-react';
import { useEmailSearch, useDocumentSearch } from '@/hooks/use-fulltext-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { log } from '@/lib/logger';
import type { TabId } from './DashboardSidebar';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: TabId) => void;
  onCreateTracking: () => void;
  onOpenShortcuts: () => void;
}

interface RecentSearch {
  term: string;
  timestamp: number;
}

// Navigation items for quick access
const NAVIGATION_ITEMS: Array<{ id: TabId; label: string; icon: React.ElementType; keywords: string[]; category: string }> = [
  // Visão Geral
  { id: 'home', label: 'Início', icon: Home, keywords: ['home', 'dashboard', 'inicio', 'painel'], category: 'Visão Geral' },
  // Rastreamento
  { id: 'emails', label: 'Emails Rastreados', icon: Mail, keywords: ['email', 'rastreamento', 'tracking', 'abertura'], category: 'Rastreamento' },
  { id: 'links', label: 'Links Rastreados', icon: Link2, keywords: ['link', 'url', 'clique', 'click'], category: 'Rastreamento' },
  { id: 'documents', label: 'Documentos', icon: FileText, keywords: ['documento', 'pdf', 'arquivo', 'upload'], category: 'Rastreamento' },
  { id: 'scheduling', label: 'Agendamento', icon: Calendar, keywords: ['agendar', 'schedule', 'programar', 'envio'], category: 'Rastreamento' },
  // Analytics
  { id: 'reports', label: 'Relatórios', icon: BarChart3, keywords: ['relatorio', 'report', 'exportar', 'csv'], category: 'Analytics' },
  { id: 'analytics', label: 'Analytics Avançado', icon: BarChart3, keywords: ['analytics', 'estatisticas', 'metricas', 'dados'], category: 'Analytics' },
  { id: 'realtime', label: 'Tempo Real', icon: Zap, keywords: ['realtime', 'tempo real', 'live', 'ao vivo'], category: 'Analytics' },
  { id: 'geo', label: 'Geo Analytics', icon: MapPin, keywords: ['geo', 'localizacao', 'mapa', 'pais', 'cidade'], category: 'Analytics' },
  { id: 'trends', label: 'Tendências', icon: BarChart3, keywords: ['tendencia', 'trend', 'previsao', 'forecast'], category: 'Analytics' },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart3, keywords: ['benchmark', 'comparacao', 'mercado'], category: 'Analytics' },
  { id: 'ai-optimizer', label: 'Otimizador IA', icon: Zap, keywords: ['ia', 'otimizar', 'assunto', 'subject', 'ai'], category: 'Analytics' },
  { id: 'insights', label: 'Insights IA', icon: Zap, keywords: ['ia', 'insights', 'inteligencia', 'sugestao'], category: 'Analytics' },
  // Engajamento
  { id: 'leads', label: 'Lead Scoring', icon: Target, keywords: ['lead', 'score', 'pontuacao', 'contato'], category: 'Engajamento' },
  { id: 'segmentation', label: 'Segmentação', icon: Users, keywords: ['segmento', 'grupo', 'segmentacao', 'audiencia'], category: 'Engajamento' },
  { id: 'followup', label: 'Follow-up', icon: MessageSquare, keywords: ['followup', 'lembrete', 'acompanhar'], category: 'Engajamento' },
  { id: 'sequences', label: 'Sequências', icon: Layout, keywords: ['sequencia', 'automacao', 'cadencia', 'drip'], category: 'Engajamento' },
  { id: 'campaigns', label: 'Campanhas', icon: Layout, keywords: ['campanha', 'campaign', 'envio em massa'], category: 'Engajamento' },
  { id: 'abtesting', label: 'Teste A/B', icon: Target, keywords: ['teste', 'ab', 'experimento', 'variante'], category: 'Engajamento' },
  { id: 'unsubscribe', label: 'Lista de Exclusão', icon: UserMinus, keywords: ['exclusao', 'unsubscribe', 'opt-out', 'descadastro'], category: 'Engajamento' },
  // Entregabilidade
  { id: 'deliverability', label: 'Reputação', icon: Shield, keywords: ['reputacao', 'entrega', 'deliverability', 'spf', 'dkim'], category: 'Entregabilidade' },
  { id: 'bouncealerts', label: 'Alertas de Bounce', icon: Bell, keywords: ['bounce', 'alerta', 'erro', 'rejeicao'], category: 'Entregabilidade' },
  { id: 'push-notifications', label: 'Push Notifications', icon: Bell, keywords: ['push', 'notificacao', 'navegador'], category: 'Entregabilidade' },
  { id: 'notifications', label: 'Histórico de Notificações', icon: Bell, keywords: ['historico', 'notificacao', 'log'], category: 'Entregabilidade' },
  // Administração
  { id: 'templates', label: 'Templates', icon: FileText, keywords: ['template', 'modelo', 'rascunho'], category: 'Administração' },
  { id: 'featureflags', label: 'Feature Flags', icon: Settings, keywords: ['feature', 'flag', 'toggle', 'funcionalidade'], category: 'Administração' },
  { id: 'audit', label: 'Auditoria', icon: Shield, keywords: ['auditoria', 'audit', 'log', 'historico'], category: 'Administração' },
  { id: 'users', label: 'Usuários e Papéis', icon: Users, keywords: ['usuario', 'papel', 'permissao', 'role'], category: 'Administração' },
  { id: 'config', label: 'Configurações', icon: Settings, keywords: ['config', 'ajuste', 'opcao', 'preferencia'], category: 'Administração' },
  // Integrações
  { id: 'integrations', label: 'Slack/Teams', icon: Globe, keywords: ['integracao', 'conectar', 'slack', 'teams'], category: 'Integrações' },
  { id: 'bitrix', label: 'Bitrix24', icon: Globe, keywords: ['bitrix', 'crm', 'bitrix24'], category: 'Integrações' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, keywords: ['whatsapp', 'mensagem', 'zap'], category: 'Integrações' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, keywords: ['webhook', 'integracao', 'api', 'endpoint'], category: 'Integrações' },
];

// Quick actions
const QUICK_ACTIONS = [
  { id: 'new-tracking', label: 'Criar novo rastreamento', icon: Plus, shortcut: 'Alt+N' },
  { id: 'shortcuts', label: 'Ver atalhos de teclado', icon: Keyboard, shortcut: '?' },
];

function GlobalSearchDialogBase({
  open,
  onOpenChange,
  onNavigate,
  onCreateTracking,
  onOpenShortcuts,
}: GlobalSearchDialogProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fuxico-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      log.error('Error loading recent searches:', e);
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim() || term.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.term.toLowerCase() !== term.toLowerCase());
      const updated = [{ term, timestamp: Date.now() }, ...filtered].slice(0, 5);
      localStorage.setItem('fuxico-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('fuxico-recent-searches');
  }, []);

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!debouncedSearch) return NAVIGATION_ITEMS.slice(0, 6);
    
    const searchLower = debouncedSearch.toLowerCase();
    return NAVIGATION_ITEMS.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.keywords.some(k => k.includes(searchLower))
    );
  }, [debouncedSearch]);

  // Handle navigation
  const handleNavigate = useCallback((tabId: TabId) => {
    saveRecentSearch(search);
    onNavigate(tabId);
    onOpenChange(false);
    setSearch('');
  }, [search, saveRecentSearch, onNavigate, onOpenChange]);

  // Handle quick actions
  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'new-tracking':
        onCreateTracking();
        break;
      case 'shortcuts':
        onOpenShortcuts();
        break;
    }
    onOpenChange(false);
    setSearch('');
  }, [onCreateTracking, onOpenShortcuts, onOpenChange]);

  // Handle recent search click
  const handleRecentSearch = useCallback((term: string) => {
    setSearch(term);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar páginas, ações, emails..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div role="region" aria-label="GlobalSearchDialog" className="flex flex-col items-center gap-2 py-6">
            <Search className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado</p>
            <p className="text-xs text-muted-foreground">Tente buscar por outro termo</p>
          </div>
        </CommandEmpty>

        {/* Recent Searches */}
        {!debouncedSearch && recentSearches.length > 0 && (
          <>
            <CommandGroup heading={
              <div className="flex items-center justify-between">
                <span>Buscas recentes</span>
                <button 
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearRecentSearches}
                >
                  Limpar
                </button>
              </div>
            }>
              {recentSearches.map((recent) => (
                <CommandItem
                  key={recent.timestamp}
                  onSelect={() => handleRecentSearch(recent.term)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{recent.term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Actions */}
        {!debouncedSearch && (
          <>
            <CommandGroup heading="Ações rápidas">
              {QUICK_ACTIONS.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleQuickAction(action.id)}
                  className="gap-2"
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {action.shortcut}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading={debouncedSearch ? 'Resultados' : 'Navegação'}>
          {filteredNavItems.map((item) => (
            <CommandItem
              key={item.id}
              value={item.label}
              onSelect={() => handleNavigate(item.id)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
              <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      
      {/* Footer with hint */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd> selecionar
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> navegar
          <span className="mx-2">•</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">esc</kbd> fechar
        </span>
      </div>
    </CommandDialog>
  );
}

// Hook for managing global search dialog with Alt+F shortcut
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+F to open global search
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setOpen(true);
      }
      // Also support Cmd/Ctrl+K as common pattern
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}

export const GlobalSearchDialog = memo(GlobalSearchDialogBase);
export default GlobalSearchDialog;
