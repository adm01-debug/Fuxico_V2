// =============================================================================
// FUXICO - Dashboard Sidebar with Notification Badges
// =============================================================================

import React from 'react'
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
  Sparkles,
  GitBranch,
  Radio,
  Wand2,
  MessageCircle,
  Award,
  UsersRound,
  BellDot,
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
import { useBounceAlerts } from '@/hooks/use-bounce-alerts'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import logoImg from '@/assets/logo.webp'

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
  | 'sequences'
  | 'templates'
  | 'audit'
  | 'users'
  | 'config'
  | 'bitrix'
  | 'webhooks'
  | 'integrations'
  | 'trends'
  | 'featureflags'
  | 'realtime'
  | 'ai-optimizer'
  | 'push-notifications'
  | 'whatsapp'
  | 'benchmark'
  | 'segmentation'

interface MenuItem {
  id: TabId
  label: string
  icon: LucideIcon
  badge?: number | 'new' | 'beta'
}

interface MenuCategory {
  id: string
  label: string
  icon: LucideIcon
  items: MenuItem[]
  defaultOpen?: boolean
}

// =============================================================================
// NOTIFICATION BADGE COMPONENT
// =============================================================================

function NotificationBadge({ count, variant = 'default' }: { count: number | 'new' | 'beta'; variant?: 'default' | 'warning' | 'destructive' }) {
  if (count === 0) return null;
  
  const isNew = count === 'new';
  const isBeta = count === 'beta';
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <Badge 
        variant={isNew ? 'default' : isBeta ? 'secondary' : variant === 'destructive' ? 'destructive' : 'outline'}
        className={cn(
          "h-5 min-w-5 flex items-center justify-center px-1.5 text-[10px] font-bold",
          isNew && "bg-primary text-primary-foreground",
          isBeta && "bg-violet-500/20 text-violet-500 border-violet-500/30",
          variant === 'warning' && "bg-warning/20 text-warning border-warning/30",
          variant === 'destructive' && "animate-pulse"
        )}
      >
        {isNew ? 'NEW' : isBeta ? 'BETA' : count}
      </Badge>
    </motion.div>
  )
}

// =============================================================================
// MENU CONFIGURATION WITH DYNAMIC BADGES
// =============================================================================

function useMenuCategories(): MenuCategory[] {
  const { unreadCount: bounceAlertCount } = useBounceAlerts();
  
  return [
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
        { id: 'realtime', label: 'Tempo Real', icon: Radio, badge: 'new' as const },
        { id: 'geo', label: 'Geo Analytics', icon: Globe },
        { id: 'trends', label: 'Tendências', icon: TrendingUp, badge: 'new' as const },
        { id: 'benchmark', label: 'Benchmark', icon: Award, badge: 'new' as const },
        { id: 'ai-optimizer', label: 'Otimizador IA', icon: Wand2, badge: 'new' as const },
        { id: 'insights', label: 'Insights IA', icon: Brain, badge: 'beta' as const },
      ],
    },
    {
      id: 'engagement',
      label: 'Engajamento',
      icon: Zap,
      items: [
        { id: 'leads', label: 'Lead Scoring', icon: Flame },
        { id: 'segmentation', label: 'Segmentação', icon: UsersRound, badge: 'new' as const },
        { id: 'followup', label: 'Follow-up', icon: Bell },
        { id: 'sequences', label: 'Sequências', icon: GitBranch, badge: 'new' as const },
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
        { id: 'bouncealerts', label: 'Alertas Bounce', icon: AlertTriangle, badge: bounceAlertCount },
        { id: 'push-notifications', label: 'Push Notif.', icon: BellDot, badge: 'new' as const },
        { id: 'notifications', label: 'Histórico', icon: BellRing },
      ],
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: Shield,
      items: [
        { id: 'templates', label: 'Templates', icon: Settings },
        { id: 'featureflags', label: 'Feature Flags', icon: Activity, badge: 'new' as const },
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
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, badge: 'new' as const },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
      ],
    },
  ];
}

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
          'transition-all duration-200 group/item relative',
          isActive && 'bg-primary/10 text-primary font-medium'
        )}
      >
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary rounded-full transition-all duration-300",
          isActive && "h-4"
        )} />
        <item.icon className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isActive && "scale-110"
        )} />
        <span className="truncate flex-1">{item.label}</span>
        <AnimatePresence>
          {item.badge && !isCollapsed && (
            <NotificationBadge 
              count={item.badge} 
              variant={typeof item.badge === 'number' && item.badge > 0 ? 'warning' : 'default'}
            />
          )}
        </AnimatePresence>
        {item.badge && isCollapsed && typeof item.badge === 'number' && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        )}
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
  
  // Calculate total badges in category
  const totalBadges = category.items.reduce((acc, item) => {
    if (typeof item.badge === 'number') return acc + item.badge;
    return acc;
  }, 0);

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
              'cursor-pointer hover:bg-sidebar-accent rounded-md transition-all duration-200 flex items-center justify-between pr-2',
              hasActiveItem && 'text-primary font-medium'
            )}
          >
            <div className="flex items-center gap-2">
              <category.icon className={cn(
                "h-4 w-4 transition-colors duration-200",
                hasActiveItem && "text-primary"
              )} />
              <span>{category.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AnimatePresence>
                {!isOpen && totalBadges > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="outline" className="h-4 min-w-4 px-1 text-[9px] bg-warning/20 text-warning border-warning/30">
                      {totalBadges}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
              <ChevronDown 
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )} 
              />
            </div>
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
  const menuCategories = useMenuCategories()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl dark:bg-sidebar/90 dark:border-primary/10">
      <SidebarHeader className="border-b border-sidebar-border/50 dark:border-primary/10">
        <div className="flex items-center gap-3 px-2 py-3">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/20 rounded-xl blur-md opacity-60 dark:opacity-80" />
            <img 
              src={logoImg} 
              alt="FUXICO" 
              className="relative h-9 w-9 rounded-xl shadow-lg"
            />
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              role="navigation" aria-label="Menu Principal" className="flex flex-col"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm">FUXICO</span>
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground">Email Tracking Pro</span>
            </motion.div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full py-2">
          {menuCategories.map((category) => (
            <CategoryGroup
              key={category.id}
              category={category}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50">
        <div className="flex items-center justify-between px-2 py-2">
          {!isCollapsed && (
            <motion.span 
              className="text-[10px] text-muted-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <kbd className="px-1 py-0.5 rounded bg-muted/50 text-muted-foreground text-[9px] font-mono">⌘B</kbd> colapsar
            </motion.span>
          )}
          <SidebarTrigger className="ml-auto hover:bg-sidebar-accent" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// Export menu categories for breadcrumbs
export const MENU_CATEGORIES = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard, items: [{ id: 'home', label: 'Início', icon: Home }] },
  { id: 'tracking', label: 'Rastreamento', icon: Mail, items: [
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'scheduling', label: 'Agendamento', icon: Clock },
  ]},
  { id: 'analytics', label: 'Analytics', icon: PieChart, items: [
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics Avançado', icon: TrendingUp },
    { id: 'geo', label: 'Geo Analytics', icon: Globe },
    { id: 'insights', label: 'Insights IA', icon: Brain },
  ]},
];
