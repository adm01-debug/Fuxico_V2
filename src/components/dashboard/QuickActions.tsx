// =============================================================================
// FUXICO - Quick Actions Premium Component
// Ações rápidas redesenhadas com animações e visual premium
// Versão: 2.0 - Premium Design
// =============================================================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipWrapper, ShortcutBadge } from '@/components/ui/tooltip-wrapper';
import {
  Mail,
  Plus,
  FileText,
  Link as LinkIcon,
  Download,
  Settings,
  BarChart3,
  Bell,
  Zap,
  ArrowRight,
  Keyboard,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabId } from './DashboardSidebar';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  tabId?: TabId;
  shortcut?: string;
  onClick?: () => void;
  badge?: string;
  isNew?: boolean;
  isPrimary?: boolean;
}

interface QuickActionsProps {
  onNavigate: (tabId: TabId) => void;
  onCreateTracking?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// Premium Action Card Component
function ActionCard({ 
  action, 
  onAction, 
  isHovered, 
  onHover 
}: { 
  action: QuickAction; 
  onAction: () => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHover(action.id)}
      onMouseLeave={() => onHover(null)}
    >
      <TooltipWrapper 
        content={action.description}
        shortcut={action.shortcut}
        side="bottom"
      >
        <button
          onClick={onAction}
          className={cn(
            "relative w-full flex flex-col items-center gap-3 p-4 rounded-2xl",
            "border border-border/50 backdrop-blur-sm",
            "transition-all duration-300 ease-out",
            "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            "group overflow-hidden",
            action.isPrimary && "border-primary/30 bg-primary/5"
          )}
        >
          {/* Background gradient on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.1 : 0 }}
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              action.gradient
            )}
          />

          {/* Shimmer effect */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '100%', opacity: 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              />
            )}
          </AnimatePresence>

          {/* Icon container */}
          <div className="relative">
            <motion.div
              animate={{ 
                rotate: isHovered ? [0, -10, 10, 0] : 0,
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.4 }}
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br shadow-lg",
                action.gradient,
                "text-white"
              )}
            >
              {action.icon}
            </motion.div>

            {/* Badges */}
            {action.isNew && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="default" className="h-4 px-1 text-[10px] bg-gradient-to-r from-green-500 to-emerald-500">
                  NEW
                </Badge>
              </motion.div>
            )}

            {action.badge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {action.badge}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Label & Description */}
          <div className="relative text-center z-10">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {action.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 hidden sm:block">
              {action.description}
            </p>
          </div>

          {/* Arrow indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0, 
              x: isHovered ? 0 : -10 
            }}
            className="absolute bottom-3 right-3"
          >
            <ArrowRight className="h-4 w-4 text-primary" />
          </motion.div>

          {/* Shortcut badge */}
          {action.shortcut && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.5 }}
              className="absolute top-2 right-2"
            >
              <ShortcutBadge shortcut={action.shortcut} className="text-[10px] opacity-60" />
            </motion.div>
          )}
        </button>
      </TooltipWrapper>
    </motion.div>
  );
}

export function QuickActions({ onNavigate, onCreateTracking }: QuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const handleAction = useCallback((action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.tabId) {
      onNavigate(action.tabId);
    }
  }, [onNavigate]);

  const actions: QuickAction[] = [
    {
      id: 'create-tracking',
      label: 'Novo Rastreamento',
      description: 'Criar pixel de rastreamento',
      icon: <Plus className="h-5 w-5" />,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500',
      shortcut: 'Alt+N',
      onClick: onCreateTracking,
      isPrimary: true,
    },
    {
      id: 'view-emails',
      label: 'Ver Emails',
      description: 'Lista de emails rastreados',
      icon: <Mail className="h-5 w-5" />,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500',
      tabId: 'emails',
      shortcut: 'Alt+E',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Métricas avançadas',
      icon: <BarChart3 className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500',
      tabId: 'analytics',
      shortcut: 'Alt+A',
      isNew: true,
    },
    {
      id: 'documents',
      label: 'Documentos',
      description: 'PDFs e arquivos rastreados',
      icon: <FileText className="h-5 w-5" />,
      gradient: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500',
      tabId: 'documents',
    },
    {
      id: 'links',
      label: 'Links',
      description: 'Links rastreáveis',
      icon: <LinkIcon className="h-5 w-5" />,
      gradient: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500',
      tabId: 'links',
    },
    {
      id: 'reports',
      label: 'Relatórios',
      description: 'Exportar e agendar',
      icon: <Download className="h-5 w-5" />,
      gradient: 'from-indigo-500 to-blue-600',
      iconBg: 'bg-indigo-500',
      tabId: 'reports',
    },
  ];

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Zap className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold">Ações Rápidas</h3>
              <p className="text-xs text-muted-foreground">Acesso direto às principais funções</p>
            </div>
          </div>
          <TooltipWrapper content="Ver todos os atalhos" shortcut="?">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipWrapper>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onAction={() => handleAction(action)}
              isHovered={hoveredAction === action.id}
              onHover={setHoveredAction}
            />
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or mobile - Premium version
export function QuickActionsCompact({ onNavigate, onCreateTracking }: QuickActionsProps) {
  const mainActions: Array<{ 
    id: string; 
    icon: React.ReactNode; 
    label: string; 
    tabId?: TabId; 
    onClick?: () => void;
    gradient: string;
  }> = [
    {
      id: 'create',
      icon: <Plus className="h-4 w-4" />,
      label: 'Novo',
      onClick: () => onCreateTracking?.(),
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      id: 'emails',
      icon: <Mail className="h-4 w-4" />,
      label: 'Emails',
      tabId: 'emails',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      tabId: 'analytics',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'settings',
      icon: <Settings className="h-4 w-4" />,
      label: 'Config',
      tabId: 'config',
      gradient: 'from-slate-500 to-gray-600',
    },
  ];

  const handleClick = (action: typeof mainActions[0]) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.tabId) {
      onNavigate(action.tabId);
    }
  };

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-xl backdrop-blur-sm border border-border/30">
      {mainActions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClick(action)}
            className={cn(
              "flex-1 h-9 px-3 rounded-lg gap-1.5",
              "hover:bg-primary/10 hover:text-primary",
              "transition-all duration-200"
            )}
          >
            <span className={cn(
              "p-1 rounded-md bg-gradient-to-br text-white",
              action.gradient
            )}>
              {action.icon}
            </span>
            <span className="text-xs font-medium hidden sm:inline">{action.label}</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// Mini floating action button
export function QuickActionsFAB({ onCreateTracking }: { onCreateTracking?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col gap-2"
          >
            {[
              { icon: <Mail className="h-4 w-4" />, label: 'Email' },
              { icon: <FileText className="h-4 w-4" />, label: 'Doc' },
              { icon: <LinkIcon className="h-4 w-4" />, label: 'Link' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-lg gap-2"
                >
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (!isExpanded) {
            onCreateTracking?.();
          }
          setIsExpanded(!isExpanded);
        }}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl",
          "bg-gradient-to-br from-primary to-primary/80",
          "flex items-center justify-center",
          "hover:shadow-primary/30",
          "transition-shadow duration-300"
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

export default QuickActions;
