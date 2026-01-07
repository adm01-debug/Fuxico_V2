// =============================================================================
// FUXICO - Dashboard Simplificado
// =============================================================================

import React, { Suspense, lazy, useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { 
  Mail, 
  Link as LinkIcon, 
  FileText, 
  BarChart3, 
  Settings, 
  Users,
  Building2,
  Shield,
  Activity,
  TrendingUp,
  Home,
  Webhook,
  Plug,
  Flame,
  Bell,
  BellRing,
  Brain,
  FlaskConical,
  UserX,
  Target,
  AlertTriangle,
  Globe,
  Clock,
  HeartPulse,
} from 'lucide-react'
import { JoyrideTour, useOnboardingTour, TourTriggerButton, TourSelector } from '@/components/onboarding/JoyrideTour'

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
// TIPOS
// =============================================================================

type TabId = 
  | 'home'
  | 'emails' 
  | 'links' 
  | 'documents' 
  | 'reports' 
  | 'analytics'
  | 'geo'
  | 'scheduling'
  | 'deliverability'
  | 'bouncealerts'
  | 'notifications'
  | 'leads'
  | 'followup'
  | 'insights'
  | 'campaigns'
  | 'abtesting'
  | 'unsubscribe'
  | 'templates'
  | 'audit'
  | 'users'
  | 'config'
  | 'bitrix'
  | 'webhooks'
  | 'integrations'

interface TabConfig {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.LazyExoticComponent<React.ComponentType<any>>
  tourTarget?: string
}

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS: TabConfig[] = [
  {
    id: 'home',
    label: 'Início',
    icon: <Home className="h-4 w-4" />,
    component: DashboardHome,
  },
  {
    id: 'emails',
    label: 'Emails',
    icon: <Mail className="h-4 w-4" />,
    component: EmailTable,
    tourTarget: 'emails-tab',
  },
  {
    id: 'links',
    label: 'Links',
    icon: <LinkIcon className="h-4 w-4" />,
    component: LinksTab,
    tourTarget: 'links-tab',
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: <FileText className="h-4 w-4" />,
    component: DocumentsTab,
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <BarChart3 className="h-4 w-4" />,
    component: ReportsTab,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="h-4 w-4" />,
    component: AdvancedAnalytics,
    tourTarget: 'analytics-tab',
  },
  {
    id: 'geo',
    label: 'Geo Analytics',
    icon: <Globe className="h-4 w-4" />,
    component: GeoAnalyticsTab,
  },
  {
    id: 'scheduling',
    label: 'Agendamento',
    icon: <Clock className="h-4 w-4" />,
    component: EmailSchedulingTab,
  },
  {
    id: 'deliverability',
    label: 'Deliverability',
    icon: <HeartPulse className="h-4 w-4" />,
    component: DeliverabilityTab,
  },
  {
    id: 'bouncealerts',
    label: 'Alertas Bounce',
    icon: <AlertTriangle className="h-4 w-4" />,
    component: BounceAlertsTab,
  },
  {
    id: 'notifications',
    label: 'Histórico',
    icon: <BellRing className="h-4 w-4" />,
    component: NotificationHistoryTab,
  },
  {
    id: 'leads',
    label: 'Lead Scoring',
    icon: <Flame className="h-4 w-4" />,
    component: LeadScoringTab,
    tourTarget: 'leads-tab',
  },
  {
    id: 'followup',
    label: 'Follow-up',
    icon: <Bell className="h-4 w-4" />,
    component: FollowUpTab,
  },
  {
    id: 'insights',
    label: 'Insights IA',
    icon: <Brain className="h-4 w-4" />,
    component: InsightsTab,
  },
  {
    id: 'campaigns',
    label: 'Campanhas',
    icon: <Target className="h-4 w-4" />,
    component: CampaignsTab,
  },
  {
    id: 'abtesting',
    label: 'Teste A/B',
    icon: <FlaskConical className="h-4 w-4" />,
    component: ABTestingTab,
  },
  {
    id: 'unsubscribe',
    label: 'Exclusão',
    icon: <UserX className="h-4 w-4" />,
    component: UnsubscribeTab,
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: <Settings className="h-4 w-4" />,
    component: TemplatesTab,
  },
  {
    id: 'audit',
    label: 'Auditoria',
    icon: <Shield className="h-4 w-4" />,
    component: AuditTab,
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: <Users className="h-4 w-4" />,
    component: UserRolesTab,
  },
  {
    id: 'config',
    label: 'Configuração',
    icon: <Activity className="h-4 w-4" />,
    component: AuditConfigTab,
  },
  {
    id: 'bitrix',
    label: 'Bitrix24',
    icon: <Building2 className="h-4 w-4" />,
    component: BitrixTab,
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: <Webhook className="h-4 w-4" />,
    component: WebhookTab,
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: <Plug className="h-4 w-4" />,
    component: IntegrationsTab,
  },
]

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const { tourState, setTourState, startTour, completeTour, hasCompletedTour, completedTours } = useOnboardingTour()
  
  // Mapa de tab para tour correspondente
  const tabToTourMap: Partial<Record<TabId, string>> = {
    links: 'links',
    documents: 'documents',
    analytics: 'analytics',
    leads: 'leads',
    emails: 'emails',
    geo: 'geo',
  }
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabId)
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
  
  return (
    <div className="container mx-auto p-6 xl:p-8 xl:max-w-screen-2xl">
      {/* Header com botão de tour */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 xl:mb-8">
        <h1 className="text-3xl font-bold xl:text-4xl">Dashboard</h1>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Botão de tour do módulo atual */}
          {currentTabHasTour && (
            <TourTriggerButton 
              onClick={handleStartModuleTour} 
              hasCompleted={hasCompletedTour(currentTourId)} 
            />
          )}
          {/* Seletor de todos os tours */}
          <TourSelector 
            onStartTour={startTour} 
            completedTours={completedTours} 
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex flex-wrap gap-1 xl:gap-2" data-tour="tabs">
          {TABS.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2 xl:gap-3"
              data-tour={tab.tourTarget}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {TABS.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <Suspense fallback={<TabSkeleton />}>
              <tab.component />
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Componente do Tour */}
      <JoyrideTour 
        tourState={tourState} 
        setTourState={setTourState}
        onComplete={completeTour}
      />
    </div>
  )
}
