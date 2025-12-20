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
  Flame,
  Bell,
} from 'lucide-react'

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
  | 'leads'
  | 'followup'
  | 'templates'
  | 'audit'
  | 'users'
  | 'config'
  | 'bitrix'
  | 'webhooks'

interface TabConfig {
  id: TabId
  label: string
  icon: React.ReactNode
  component: React.LazyExoticComponent<React.ComponentType<any>>
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
  },
  {
    id: 'links',
    label: 'Links',
    icon: <LinkIcon className="h-4 w-4" />,
    component: LinksTab,
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
  },
  {
    id: 'leads',
    label: 'Lead Scoring',
    icon: <Flame className="h-4 w-4" />,
    component: LeadScoringTab,
  },
  {
    id: 'followup',
    label: 'Follow-up',
    icon: <Bell className="h-4 w-4" />,
    component: FollowUpTab,
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
]

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabId)
  }, [])
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
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
    </div>
  )
}
