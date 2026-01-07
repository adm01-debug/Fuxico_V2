import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabId } from '@/components/dashboard/DashboardSidebar'

interface BreadcrumbItem {
  label: string
  tabId?: TabId
}

interface DashboardBreadcrumbsProps {
  activeTab: TabId
  onNavigate?: (tab: TabId) => void
  className?: string
}

// Mapeamento de categorias para tabs
const TAB_CATEGORIES: Record<TabId, { category: string; categoryTab?: TabId }> = {
  home: { category: 'Início' },
  emails: { category: 'Rastreamento' },
  links: { category: 'Rastreamento', categoryTab: 'emails' },
  documents: { category: 'Rastreamento', categoryTab: 'emails' },
  scheduling: { category: 'Rastreamento', categoryTab: 'emails' },
  reports: { category: 'Analytics' },
  analytics: { category: 'Analytics', categoryTab: 'reports' },
  geo: { category: 'Analytics', categoryTab: 'reports' },
  insights: { category: 'Analytics', categoryTab: 'reports' },
  leads: { category: 'Engajamento' },
  followup: { category: 'Engajamento', categoryTab: 'leads' },
  campaigns: { category: 'Engajamento', categoryTab: 'leads' },
  abtesting: { category: 'Engajamento', categoryTab: 'leads' },
  unsubscribe: { category: 'Engajamento', categoryTab: 'leads' },
  deliverability: { category: 'Entregabilidade' },
  bouncealerts: { category: 'Entregabilidade', categoryTab: 'deliverability' },
  notifications: { category: 'Entregabilidade', categoryTab: 'deliverability' },
  templates: { category: 'Administração' },
  audit: { category: 'Administração', categoryTab: 'templates' },
  users: { category: 'Administração', categoryTab: 'templates' },
  config: { category: 'Administração', categoryTab: 'templates' },
  integrations: { category: 'Integrações' },
  bitrix: { category: 'Integrações', categoryTab: 'integrations' },
  webhooks: { category: 'Integrações', categoryTab: 'integrations' },
}

const TAB_LABELS: Record<TabId, string> = {
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
  insights: 'Insights IA',
  campaigns: 'Campanhas',
  abtesting: 'Teste A/B',
  unsubscribe: 'Exclusão',
  templates: 'Templates',
  audit: 'Auditoria',
  users: 'Usuários',
  config: 'Configuração',
  bitrix: 'Bitrix24',
  webhooks: 'Webhooks',
  integrations: 'Slack/Teams',
}

export function DashboardBreadcrumbs({
  activeTab,
  onNavigate,
  className,
}: DashboardBreadcrumbsProps) {
  const config = TAB_CATEGORIES[activeTab]
  
  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', tabId: 'home' },
  ]

  // Add category if not home
  if (activeTab !== 'home') {
    items.push({
      label: config.category,
      tabId: config.categoryTab,
    })
    
    // Add current page
    items.push({
      label: TAB_LABELS[activeTab],
    })
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isClickable = item.tabId && !isLast && onNavigate

          return (
            <li key={index} className="flex items-center gap-1">
              {index === 0 && (
                <Home className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              )}
              
              {isClickable ? (
                <button
                  onClick={() => onNavigate(item.tabId!)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
