import React from 'react'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Mail, 
  BarChart3, 
  Zap, 
  Settings,
  type LucideIcon 
} from 'lucide-react'
import type { TabId } from './DashboardSidebar'

interface MobileNavItem {
  id: TabId
  label: string
  icon: LucideIcon
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'leads', label: 'Leads', icon: Zap },
  { id: 'config', label: 'Config', icon: Settings },
]

interface MobileBottomNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 rounded-lg mx-0.5',
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
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
