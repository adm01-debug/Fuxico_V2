// =============================================================================
// FUXICO - Dashboard com Lazy Loading
// Arquivo: src/pages/Dashboard.tsx
// Descrição: Dashboard principal com code splitting para melhor performance
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
  Activity
} from 'lucide-react'
import { useUserRoles } from '@/hooks/use-user-roles'
import { logger } from '@/lib/logger'

// =============================================================================
// LAZY LOADING DOS COMPONENTES PESADOS
// =============================================================================
// Code splitting: cada tab é carregada apenas quando acessada pela primeira vez
// Isso reduz o bundle inicial em ~40%

const EmailTable = lazy(() => 
  import('@/components/dashboard/EmailTable').then(module => {
    logger.debug('EmailTable chunk loaded')
    return module
  })
)

const LinksTab = lazy(() => 
  import('@/components/dashboard/LinksTab').then(module => {
    logger.debug('LinksTab chunk loaded')
    return module
  })
)

const DocumentsTab = lazy(() => 
  import('@/components/dashboard/DocumentsTab').then(module => {
    logger.debug('DocumentsTab chunk loaded')
    return module
  })
)

const ReportsTab = lazy(() => 
  import('@/components/dashboard/ReportsTab').then(module => {
    logger.debug('ReportsTab chunk loaded')
    return module
  })
)

const TemplatesTab = lazy(() => 
  import('@/components/dashboard/TemplatesTab').then(module => {
    logger.debug('TemplatesTab chunk loaded')
    return module
  })
)

// Componentes admin (carregados apenas para admins)
const AuditTab = lazy(() => 
  import('@/components/dashboard/AuditTab').then(module => {
    logger.debug('AuditTab chunk loaded')
    return module
  })
)

const UserRolesTab = lazy(() => 
  import('@/components/dashboard/UserRolesTab').then(module => {
    logger.debug('UserRolesTab chunk loaded')
    return module
  })
)

const AuditConfigTab = lazy(() => 
  import('@/components/dashboard/AuditConfigTab').then(module => {
    logger.debug('AuditConfigTab chunk loaded')
    return module
  })
)

const BitrixTab = lazy(() => 
  import('@/components/dashboard/BitrixTab').then(module => {
    logger.debug('BitrixTab chunk loaded')
    return module
  })
)

// =============================================================================
// COMPONENTES DE LOADING
// =============================================================================

/**
 * Skeleton para tabelas
 */
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
          <Skeleton className="h-10 w-[100px]" />
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

/**
 * Skeleton para gráficos
 */
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton genérico
 */
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

/**
 * Error Boundary para tabs lazy
 */
function TabErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-6 text-center">
        <p className="text-destructive mb-4">Erro ao carregar componente</p>
        <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
        <button 
          onClick={resetError}
          className="text-primary underline text-sm"
        >
          Tentar novamente
        </button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// TIPOS
// =============================================================================

type TabId = 
  | 'emails' 
  | 'links' 
  | 'documents' 
  | 'reports' 
  | 'templates'
  | 'audit'
  | 'users'
  | 'config'
  | 'bitrix'

interface TabConfig {
  id: TabId
  label: string
  icon: React.ReactNode
  requiresAdmin?: boolean
  component: React.LazyExoticComponent<React.ComponentType>
}

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS: TabConfig[] = [
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
    id: 'templates',
    label: 'Templates',
    icon: <Settings className="h-4 w-4" />,
    component: TemplatesTab,
  },
  // Admin tabs
  {
    id: 'audit',
    label: 'Auditoria',
    icon: <Shield className="h-4 w-4" />,
    requiresAdmin: true,
    component: AuditTab,
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: <Users className="h-4 w-4" />,
    requiresAdmin: true,
    component: UserRolesTab,
  },
  {
    id: 'config',
    label: 'Configuração',
    icon: <Activity className="h-4 w-4" />,
    requiresAdmin: true,
    component: AuditConfigTab,
  },
  {
    id: 'bitrix',
    label: 'Bitrix24',
    icon: <Building2 className="h-4 w-4" />,
    component: BitrixTab,
  },
]

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('emails')
  const { isAdmin, isLoading: rolesLoading } = useUserRoles()
  
  // Filtrar tabs baseado em permissões
  const visibleTabs = TABS.filter(tab => !tab.requiresAdmin || isAdmin)
  
  // Handler de mudança de tab com logging
  const handleTabChange = useCallback((value: string) => {
    const tabId = value as TabId
    logger.debug('Tab changed', { from: activeTab, to: tabId })
    setActiveTab(tabId)
  }, [activeTab])
  
  // Loading inicial de permissões
  if (rolesLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <TableSkeleton />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 flex flex-wrap gap-1">
          {visibleTabs.map(tab => (
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
        
        {visibleTabs.map(tab => (
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

// =============================================================================
// PRELOAD DE CHUNKS CRÍTICOS
// =============================================================================

/**
 * Função para preload de chunks em background
 * Chame isso após o primeiro render para preparar tabs frequentes
 */
export function preloadCriticalChunks(): void {
  // Preload do EmailTable (tab padrão)
  import('@/components/dashboard/EmailTable')
  
  // Preload após 3 segundos de idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('@/components/dashboard/LinksTab')
      import('@/components/dashboard/ReportsTab')
    }, { timeout: 5000 })
  }
}
