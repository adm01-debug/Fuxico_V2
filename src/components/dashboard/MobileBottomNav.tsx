import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Mail, 
  BarChart3, 
  Zap, 
  MoreHorizontal,
  Link2,
  FileText,
  Bell,
  Users,
  Shield,
  Settings,
  Calendar,
  Target,
  Globe,
  Webhook,
  TestTube,
  TrendingUp,
  MessageSquare,
  Clock,
  GitBranch,
  X,
  type LucideIcon 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TabId } from './DashboardSidebar'

interface MobileNavItem {
  id: TabId
  label: string
  icon: LucideIcon
}

// Main nav items (always visible)
const MAIN_NAV_ITEMS: MobileNavItem[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Zap },
]

// Additional items in "More" menu
const MORE_NAV_ITEMS: MobileNavItem[] = [
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'sequences', label: 'Sequências', icon: GitBranch },
  { id: 'campaigns', label: 'Campanhas', icon: Target },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'scheduling', label: 'Agendamento', icon: Calendar },
  { id: 'followup', label: 'Follow-up', icon: Clock },
  { id: 'deliverability', label: 'Reputação', icon: TrendingUp },
  { id: 'geo', label: 'Geolocalização', icon: Globe },
  { id: 'abtesting', label: 'Testes A/B', icon: TestTube },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'audit', label: 'Auditoria', icon: Shield },
  { id: 'config', label: 'Configurações', icon: Settings },
]

interface MobileBottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const handleTabChange = (tab: TabId) => {
    onTabChange(tab)
    setIsMoreOpen(false)
  }

  const isActiveInMore = MORE_NAV_ITEMS.some(item => item.id === activeTab)

  return (
    <>
      {/* More Menu Overlay */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMoreOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-background border-t rounded-t-2xl shadow-2xl max-h-[60vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-foreground">Menu</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid of items */}
              <div className="p-4 overflow-y-auto max-h-[calc(60vh-60px)]">
                <div className="grid grid-cols-4 gap-3">
                  {MORE_NAV_ITEMS.map((item, index) => {
                    const isActive = activeTab === item.id
                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleTabChange(item.id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all min-h-[80px]',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full transition-all',
                            isActive && 'bg-primary/20'
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {item.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 rounded-lg mx-0.5 relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-300',
                    isActive && 'bg-primary/10 scale-110'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-105')} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-all',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </button>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 rounded-lg mx-0.5 relative',
              (isMoreOpen || isActiveInMore)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-300',
                (isMoreOpen || isActiveInMore) && 'bg-primary/10 scale-110'
              )}
            >
              <MoreHorizontal className={cn('h-5 w-5 transition-transform', (isMoreOpen || isActiveInMore) && 'scale-105')} />
            </div>
            <span className={cn(
              'text-[10px] font-medium transition-all',
              (isMoreOpen || isActiveInMore) && 'font-semibold'
            )}>
              Mais
            </span>
            {isActiveInMore && !isMoreOpen && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
              />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}

export default MobileBottomNav
