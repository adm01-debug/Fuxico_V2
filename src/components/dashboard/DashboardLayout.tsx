import React, { Suspense, lazy, useState, useCallback, useMemo, useEffect } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { DashboardSidebar, type TabId } from './DashboardSidebar'
import MobileBottomNav from './MobileBottomNav'
import DashboardBreadcrumbs from './DashboardBreadcrumbs'
import { JoyrideTour, useOnboardingTour, TourTriggerButton, TourSelector } from '@/components/onboarding/JoyrideTour'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { KeyboardShortcutsDialog, useKeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { GlobalSearchDialog, useGlobalSearch } from './GlobalSearchDialog'
import { CreateTrackingDialog } from './CreateTrackingDialog'
import { NotificationCenter } from './NotificationCenter'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useIsMobile } from '@/hooks/use-media-query'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Keyboard, Plus, Search, Settings2 } from 'lucide-react'
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper'
import { BackButton } from '@/components/ui/back-button'
import TabSkeleton from './TabSkeleton'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
const WebhookTab = lazy(() => import('@/components/dashboard/WebhookTab'))
const LeadScoringTab = lazy(() => import('@/components/dashboard/LeadScoringTab'))
const FollowUpTab = lazy(() => import('@/components/dashboard/FollowUpTab'))
const CampaignsTab = lazy(() => import('@/components/dashboard/CampaignsTab'))
const ABTestingTab = lazy(() => import('@/components/dashboard/ABTestingTab'))
const UnsubscribeTab = lazy(() => import('@/components/dashboard/UnsubscribeTab'))
const SequencesTab = lazy(() => import('@/components/dashboard/SequencesTab'))
const GeoAnalyticsTab = lazy(() => import('@/components/dashboard/GeoAnalyticsTab'))
const EmailSchedulingTab = lazy(() => import('@/components/dashboard/EmailSchedulingTab'))
const DeliverabilityTab = lazy(() => import('@/components/dashboard/DeliverabilityTab'))
const BounceAlertsTab = lazy(() => import('@/components/dashboard/BounceAlertsTab'))
const NotificationHistoryTab = lazy(() => import('@/components/dashboard/NotificationHistoryTab'))
const TrendPredictionTab = lazy(() => import('@/components/dashboard/TrendPredictionTab'))
const FeatureFlagsTab = lazy(() => import('@/components/dashboard/FeatureFlagsTab'))
// New feature tabs
const RealtimeAnalyticsTab = lazy(() => import('@/components/dashboard/RealtimeAnalyticsTab'))
const AISubjectOptimizerTab = lazy(() => import('@/components/dashboard/AISubjectOptimizerTab'))
const PushNotificationsTab = lazy(() => import('@/components/dashboard/PushNotificationsTab'))
const WhatsAppIntegrationTab = lazy(() => import('@/components/dashboard/WhatsAppIntegrationTab'))
const BenchmarkReportsTab = lazy(() => import('@/components/dashboard/BenchmarkReportsTab'))
const SmartSegmentationTab = lazy(() => import('@/components/dashboard/SmartSegmentationTab'))

// =============================================================================
// MAPEAMENTO DE COMPONENTES
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TAB_COMPONENTS: Record<TabId, React.LazyExoticComponent<React.ComponentType<any>>> = {
  home: DashboardHome,
  emails: EmailTable,
  links: LinksTab,
  documents: DocumentsTab,
  reports: ReportsTab,
  analytics: ReportsTab,
  geo: GeoAnalyticsTab,
  scheduling: EmailSchedulingTab,
  deliverability: DeliverabilityTab,
  bouncealerts: BounceAlertsTab,
  notifications: NotificationHistoryTab,
  leads: LeadScoringTab,
  followup: FollowUpTab,
  insights: ReportsTab,
  campaigns: CampaignsTab,
  abtesting: ABTestingTab,
  unsubscribe: UnsubscribeTab,
  sequences: SequencesTab,
  templates: TemplatesTab,
  audit: AuditTab,
  users: UserRolesTab,
  config: AuditConfigTab,
  bitrix: BitrixTab,
  webhooks: WebhookTab,
  integrations: BitrixTab,
  trends: TrendPredictionTab,
  featureflags: FeatureFlagsTab,
  realtime: RealtimeAnalyticsTab,
  'ai-optimizer': AISubjectOptimizerTab,
  'push-notifications': PushNotificationsTab,
  whatsapp: WhatsAppIntegrationTab,
  benchmark: BenchmarkReportsTab,
  segmentation: SmartSegmentationTab,
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
  sequences: 'Sequências',
  templates: 'Templates',
  audit: 'Auditoria',
  users: 'Usuários',
  config: 'Configuração',
  bitrix: 'Bitrix24',
  webhooks: 'Webhooks',
  integrations: 'Integrações',
  trends: 'Tendências',
  featureflags: 'Feature Flags',
  realtime: 'Tempo Real',
  'ai-optimizer': 'Otimizador IA',
  'push-notifications': 'Push Notifications',
  whatsapp: 'WhatsApp',
  benchmark: 'Benchmark',
  segmentation: 'Segmentação',
}

// =============================================================================
// SKELETON VARIANTS PER TAB
// =============================================================================

const TAB_SKELETON_VARIANTS: Partial<Record<TabId, 'table' | 'metrics' | 'chart' | 'form' | 'activity' | 'dashboard'>> = {
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
  'ai-optimizer': 'form',
  'push-notifications': 'form',
  whatsapp: 'form',
  benchmark: 'chart',
  segmentation: 'table',
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [tabHistory, setTabHistory] = useState<TabId[]>(['home'])
  const [showCreateTracking, setShowCreateTracking] = useState(false)
  const { tourState, setTourState, startTour, completeTour, hasCompletedTour, completedTours } = useOnboardingTour()
  const { open: shortcutsOpen, setOpen: setShortcutsOpen } = useKeyboardShortcutsDialog()
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch()
  const isMobile = useIsMobile()
  const [hasSeenWizard, setHasSeenWizard] = useLocalStorage('fuxico-wizard-completed', false)
  const [showWizard, setShowWizard] = useState(false)

  // Show wizard for first-time users
  useEffect(() => {
    if (!hasSeenWizard) {
      // Delay to let UI settle
      const timer = setTimeout(() => setShowWizard(true), 500)
      return () => clearTimeout(timer)
    }
  }, [hasSeenWizard])

  const handleWizardComplete = useCallback(() => {
    setHasSeenWizard(true)
    setShowWizard(false)
  }, [setHasSeenWizard])

  const handleWizardSkip = useCallback(() => {
    setHasSeenWizard(true)
    setShowWizard(false)
  }, [setHasSeenWizard])

  // Mapa de tab para tour correspondente
  const tabToTourMap: Partial<Record<TabId, string>> = {
    links: 'links',
    documents: 'documents',
    analytics: 'analytics',
    leads: 'leads',
    emails: 'emails',
    geo: 'geo',
  }

  // Handle tab change with transition animation
  const handleTabChange = useCallback((value: TabId) => {
    if (value === activeTab) return
    
    setIsTransitioning(true)
    
    setTimeout(() => {
      setTabHistory(prev => [...prev, value])
      setActiveTab(value)
      setTimeout(() => setIsTransitioning(false), 150)
    }, 100)
  }, [activeTab])

  const handleBack = useCallback(() => {
    if (tabHistory.length <= 1) return
    
    setIsTransitioning(true)
    
    setTimeout(() => {
      const newHistory = [...tabHistory]
      newHistory.pop() // Remove current
      const prevTab = newHistory[newHistory.length - 1]
      
      setTabHistory(newHistory)
      setActiveTab(prevTab)
      setTimeout(() => setIsTransitioning(false), 150)
    }, 100)
  }, [tabHistory])

  // Keyboard shortcuts for navigation
  const keyboardBindings = useMemo(() => ({
    'alt+h': () => setActiveTab('home'),
    'alt+e': () => setActiveTab('emails'),
    'alt+a': () => setActiveTab('analytics'),
    'alt+l': () => setActiveTab('leads'),
    'alt+s': () => setActiveTab('config'),
    'alt+n': () => setShowCreateTracking(true),
    'escape': () => handleBack(),
  }), [handleBack])

  useKeyboardNavigation(keyboardBindings)

  // Handle create tracking modal
  const handleCreateTracking = useCallback(() => {
    setShowCreateTracking(true)
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
        
        <SidebarInset role="main" aria-label="Conteúdo Principal" className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 flex flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6">
              <SidebarTrigger className="md:hidden h-10 w-10 shrink-0" />
              
              {activeTab !== 'home' && (
                <BackButton onClick={handleBack} />
              )}
              
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-semibold lg:text-xl truncate">
                  {TAB_LABELS[activeTab]}
                </h1>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Global Search Button - Desktop */}
                <TooltipWrapper content="Busca global" shortcut="Alt+F">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground w-[140px] lg:w-[180px] justify-start hidden md:flex"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">Buscar...</span>
                    <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded hidden lg:inline">Alt+F</kbd>
                  </Button>
                </TooltipWrapper>
                
                {/* Mobile Search Button */}
                <TooltipWrapper content="Busca global" shortcut="Alt+F">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-10 w-10 md:hidden"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipWrapper>

                {/* Create Tracking Button */}
                <TooltipWrapper content="Novo rastreamento" shortcut="Alt+N">
                  <Button 
                    size="sm" 
                    className="gap-1.5 h-10 w-10 sm:w-auto sm:h-10 px-0 sm:px-3"
                    onClick={() => setShowCreateTracking(true)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Novo</span>
                  </Button>
                </TooltipWrapper>

                {/* Notification Center */}
                <NotificationCenter />

                {/* Settings button - Only on Home */}
                {activeTab === 'home' && (
                  <TooltipWrapper content="Configurações do dashboard">
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Settings2 className="h-5 w-5" />
                    </Button>
                  </TooltipWrapper>
                )}

                {/* Dark Mode Toggle */}
                <ModeToggle size="sm" className="h-10 w-10" />

                {/* Keyboard Shortcuts Button - Hidden on small mobile */}
                <TooltipWrapper content="Atalhos de teclado" shortcut="?">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 hidden sm:flex"
                    onClick={() => setShortcutsOpen(true)}
                  >
                    <Keyboard className="h-5 w-5" />
                  </Button>
                </TooltipWrapper>

                {/* Tour buttons - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-1">
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
              </div>
            </div>
            
            {/* Breadcrumbs - responsive */}
            {activeTab !== 'home' && (
              <div className="px-3 sm:px-4 lg:px-6 pb-2">
                <DashboardBreadcrumbs 
                  activeTab={activeTab} 
                  onNavigate={handleTabChange}
                  className="text-xs sm:text-sm"
                />
              </div>
            )}
          </header>

          {/* Main Content with Tab Transition */}
          <main className="flex-1 p-4 lg:p-6 xl:p-8 pb-20 md:pb-8 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10, y: 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -10, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full"
              >
                <Suspense fallback={<TabSkeleton variant={TAB_SKELETON_VARIANTS[activeTab] || 'table'} />}>
                  {activeTab === 'home' ? (
                    <ActiveComponent 
                      onNavigate={handleTabChange} 
                      onCreateTracking={handleCreateTracking}
                    />
                  ) : (
                    <ActiveComponent />
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </SidebarInset>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Componente do Tour */}
      <JoyrideTour
        tourState={tourState}
        setTourState={setTourState}
        onComplete={completeTour}
      />

      {/* Onboarding Wizard for first-time users */}
      {showWizard && (
        <OnboardingWizard 
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen} 
      />

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={handleTabChange}
        onCreateTracking={handleCreateTracking}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Create Tracking Dialog - Controlled mode */}
      <CreateTrackingDialog 
        open={showCreateTracking}
        onOpenChange={setShowCreateTracking}
        trigger={null}
      />
    </SidebarProvider>
  )
}
