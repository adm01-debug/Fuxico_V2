import React, { Suspense, lazy, useState, useCallback } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DashboardSidebar, type TabId } from './DashboardSidebar'
import { JoyrideTour, useOnboardingTour, TourTriggerButton, TourSelector } from '@/components/onboarding/JoyrideTour'
import { useIsMobile } from '@/hooks/use-mobile'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

// =============================================================================
// LAZY LOADING
// =============================================================================

const DashboardHome = lazy(() => import('@/components/dashboard/DashboardHome'))
const EmailTable = lazy(() => import('@/components/dashboard/EmailTable'))
const LinksTab = lazy(() => import('@/components/dashboard/LinksTab'))
const DocumentsTab = lazy(() => import('@/components/dashboard/DocumentsTab'))
const ReportsTab = lazy(() => import('@/components/dashboard/ReportsTab'))
const TemplatesTab = lazy(() => import('@/components/dashboard/TemplatesTab'))
const AuditTab = lazy(() => import('@/components/dashboard/AuditTab'))
const UserRolesTab = lazy(() => import('@/components/dashboard/UserRolesTab'))
const AuditConfigTab = lazy(() => import('@/components/dashboard/AuditConfigTab'))
const BitrixTab = lazy(() => import('@/components/dashboard/BitrixTab'))
const AdvancedAnalytics = lazy(() => import('@/components/dashboard/AdvancedAnalytics'))
const WebhookTab = lazy(() => import('@/components/dashboard/WebhookTab'))
const LeadScoringTab = lazy(() => import('@/components/dashboard/LeadScoringTab'))
const FollowUpTab = lazy(() => import('@/components/dashboard/FollowUpTab').then(m => ({ default: m.FollowUpTab })))
const InsightsTab = lazy(() => import('@/components/dashboard/InsightsTab'))
const CampaignsTab = lazy(() => import('@/components/dashboard/CampaignsTab'))
const ABTestingTab = lazy(() => import('@/components/dashboard/ABTestingTab'))
const UnsubscribeTab = lazy(() => import('@/components/dashboard/UnsubscribeTab'))
const GeoAnalyticsTab = lazy(() => import('@/components/dashboard/GeoAnalyticsTab').then(m => ({ default: m.GeoAnalyticsTab })))
const EmailSchedulingTab = lazy(() => import('@/components/dashboard/EmailSchedulingTab').then(m => ({ default: m.EmailSchedulingTab })))
const DeliverabilityTab = lazy(() => import('@/components/dashboard/DeliverabilityTab').then(m => ({ default: m.DeliverabilityTab })))
const BounceAlertsTab = lazy(() => import('@/components/dashboard/BounceAlertsTab').then(m => ({ default: m.BounceAlertsTab })))
const NotificationHistoryTab = lazy(() => import('@/components/dashboard/NotificationHistoryTab'))
const IntegrationsTab = lazy(() => import('@/components/dashboard/IntegrationsTab').then(m => ({ default: m.IntegrationsTab })))

// =============================================================================
// MAPEAMENTO DE COMPONENTES
// =============================================================================

const TAB_COMPONENTS: Record<TabId, React.LazyExoticComponent<React.ComponentType<any>>> = {
  home: DashboardHome,
  emails: EmailTable,
  links: LinksTab,
  documents: DocumentsTab,
  reports: ReportsTab,
  analytics: AdvancedAnalytics,
  geo: GeoAnalyticsTab,
  scheduling: EmailSchedulingTab,
  deliverability: DeliverabilityTab,
  bouncealerts: BounceAlertsTab,
  notifications: NotificationHistoryTab,
  leads: LeadScoringTab,
  followup: FollowUpTab,
  insights: InsightsTab,
  campaigns: CampaignsTab,
  abtesting: ABTestingTab,
  unsubscribe: UnsubscribeTab,
  templates: TemplatesTab,
  audit: AuditTab,
  users: UserRolesTab,
  config: AuditConfigTab,
  bitrix: BitrixTab,
  webhooks: WebhookTab,
  integrations: IntegrationsTab,
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
  integrations: 'Integrações',
}

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton />
    </div>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const { tourState, setTourState, startTour, completeTour, hasCompletedTour, completedTours } = useOnboardingTour()
  const isMobile = useIsMobile()

  // Mapa de tab para tour correspondente
  const tabToTourMap: Partial<Record<TabId, string>> = {
    links: 'links',
    documents: 'documents',
    analytics: 'analytics',
    leads: 'leads',
    emails: 'emails',
    geo: 'geo',
  }

  const handleTabChange = useCallback((value: TabId) => {
    setActiveTab(value)
  }, [])

  // Função para iniciar tour específico da tab atual
  const handleStartModuleTour = useCallback(() => {
    const tourId = tabToTourMap[activeTab]
    if (tourId) {
      startTour(tourId)
    } else {
      startTour('dashboard')
    }
  }, [activeTab, startTour])

  // Verificar se a tab atual tem um tour
  const currentTabHasTour = !!tabToTourMap[activeTab]
  const currentTourId = tabToTourMap[activeTab] || 'dashboard'

  // Renderizar componente ativo
  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <SidebarTrigger className="md:hidden" />
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold lg:text-xl">
                {TAB_LABELS[activeTab]}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {currentTabHasTour && (
                <TourTriggerButton
                  onClick={handleStartModuleTour}
                  hasCompleted={hasCompletedTour(currentTourId)}
                />
              )}
              <TourSelector
                onStartTour={startTour}
                completedTours={completedTours}
              />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 xl:p-8">
            <Suspense fallback={<TabSkeleton />}>
              <ActiveComponent />
            </Suspense>
          </main>
        </SidebarInset>
      </div>

      {/* Componente do Tour */}
      <JoyrideTour
        tourState={tourState}
        setTourState={setTourState}
        onComplete={completeTour}
      />
    </SidebarProvider>
  )
}
