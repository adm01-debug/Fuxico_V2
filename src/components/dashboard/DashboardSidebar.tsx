import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  ChevronDown,
  LayoutDashboard,
  Zap,
  PieChart,
  Cog,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

// =============================================================================
// TIPOS
// =============================================================================

export type TabId =
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

interface MenuItem {
  id: TabId
  label: string
  icon: LucideIcon
}

interface MenuCategory {
  id: string
  label: string
  icon: LucideIcon
  items: MenuItem[]
  defaultOpen?: boolean
}

// =============================================================================
// CONFIGURAÇÃO DO MENU
// =============================================================================

const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { id: 'home', label: 'Início', icon: Home },
    ],
  },
  {
    id: 'tracking',
    label: 'Rastreamento',
    icon: Mail,
    defaultOpen: true,
    items: [
      { id: 'emails', label: 'Emails', icon: Mail },
      { id: 'links', label: 'Links', icon: LinkIcon },
      { id: 'documents', label: 'Documentos', icon: FileText },
      { id: 'scheduling', label: 'Agendamento', icon: Clock },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: PieChart,
    items: [
      { id: 'reports', label: 'Relatórios', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics Avançado', icon: TrendingUp },
      { id: 'geo', label: 'Geo Analytics', icon: Globe },
      { id: 'insights', label: 'Insights IA', icon: Brain },
    ],
  },
  {
    id: 'engagement',
    label: 'Engajamento',
    icon: Zap,
    items: [
      { id: 'leads', label: 'Lead Scoring', icon: Flame },
      { id: 'followup', label: 'Follow-up', icon: Bell },
      { id: 'campaigns', label: 'Campanhas', icon: Target },
      { id: 'abtesting', label: 'Teste A/B', icon: FlaskConical },
      { id: 'unsubscribe', label: 'Exclusão', icon: UserX },
    ],
  },
  {
    id: 'deliverability',
    label: 'Entregabilidade',
    icon: HeartPulse,
    items: [
      { id: 'deliverability', label: 'Reputação', icon: HeartPulse },
      { id: 'bouncealerts', label: 'Alertas Bounce', icon: AlertTriangle },
      { id: 'notifications', label: 'Histórico', icon: BellRing },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: Shield,
    items: [
      { id: 'templates', label: 'Templates', icon: Settings },
      { id: 'audit', label: 'Auditoria', icon: Shield },
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'config', label: 'Configuração', icon: Activity },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Plug,
    items: [
      { id: 'integrations', label: 'Slack/Teams', icon: Plug },
      { id: 'bitrix', label: 'Bitrix24', icon: Building2 },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
]

// =============================================================================
// COMPONENTES
// =============================================================================

interface DashboardSidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

function SidebarMenuItemButton({
  item,
  isActive,
  onClick,
}: {
  item: MenuItem
  isActive: boolean
  onClick: () => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        isActive={isActive}
        tooltip={isCollapsed ? item.label : undefined}
        className={cn(
          'transition-all duration-200',
          isActive && 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CategoryGroup({
  category,
  activeTab,
  onTabChange,
}: {
  category: MenuCategory
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const hasActiveItem = category.items.some(item => item.id === activeTab)
  const [isOpen, setIsOpen] = React.useState(category.defaultOpen || hasActiveItem)

  // Keep open if has active item
  React.useEffect(() => {
    if (hasActiveItem) {
      setIsOpen(true)
    }
  }, [hasActiveItem])

  if (isCollapsed) {
    // In collapsed mode, show only icons
    return (
      <SidebarGroup>
        <SidebarMenu>
          {category.items.map((item) => (
            <SidebarMenuItemButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel 
            className={cn(
              'cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors flex items-center justify-between pr-2',
              hasActiveItem && 'text-primary font-medium'
            )}
          >
            <div className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span>{category.label}</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} 
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="pl-2">
              {category.items.map((item) => (
                <SidebarMenuItemButton
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => onTabChange(item.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            F
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">FUXICO</span>
              <span className="text-xs text-muted-foreground">Email Tracking</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          {MENU_CATEGORIES.map((category) => (
            <CategoryGroup
              key={category.id}
              category={category}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-2">
          {!isCollapsed && (
            <span className="text-xs text-muted-foreground">
              Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">⌘B</kbd> para colapsar
            </span>
          )}
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export { MENU_CATEGORIES }
