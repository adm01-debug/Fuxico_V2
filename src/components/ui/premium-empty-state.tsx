/**
 * Premium Empty State Component
 * 
 * @description Empty states com animações, ilustrações e visual premium
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  FileX, 
  Search, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Mail,
  FileText,
  Link2,
  Bell,
  Filter,
  Calendar,
  Users,
  BarChart3,
  type LucideIcon 
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'error' 
  | 'no-data' 
  | 'no-results'
  | 'no-emails'
  | 'no-documents'
  | 'no-links'
  | 'no-notifications'
  | 'no-filters'
  | 'no-schedule'
  | 'no-team'
  | 'no-analytics';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  icon?: LucideIcon;
}

interface PremiumEmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
  animated?: boolean;
  illustration?: 'floating' | 'pulse' | 'bounce' | 'none';
}

// ============================================================================
// Configuration
// ============================================================================

const variantConfig: Record<EmptyStateVariant, { 
  icon: LucideIcon; 
  gradient: string;
  bgGlow: string;
}> = {
  default: { 
    icon: Inbox, 
    gradient: 'from-muted-foreground/20 to-muted-foreground/5',
    bgGlow: 'bg-muted-foreground/10'
  },
  search: { 
    icon: Search, 
    gradient: 'from-blue-500/20 to-blue-500/5',
    bgGlow: 'bg-blue-500/10'
  },
  error: { 
    icon: AlertCircle, 
    gradient: 'from-destructive/20 to-destructive/5',
    bgGlow: 'bg-destructive/10'
  },
  'no-data': { 
    icon: FileX, 
    gradient: 'from-muted-foreground/20 to-muted-foreground/5',
    bgGlow: 'bg-muted-foreground/10'
  },
  'no-results': { 
    icon: Search, 
    gradient: 'from-amber-500/20 to-amber-500/5',
    bgGlow: 'bg-amber-500/10'
  },
  'no-emails': { 
    icon: Mail, 
    gradient: 'from-primary/20 to-primary/5',
    bgGlow: 'bg-primary/10'
  },
  'no-documents': { 
    icon: FileText, 
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    bgGlow: 'bg-emerald-500/10'
  },
  'no-links': { 
    icon: Link2, 
    gradient: 'from-violet-500/20 to-violet-500/5',
    bgGlow: 'bg-violet-500/10'
  },
  'no-notifications': { 
    icon: Bell, 
    gradient: 'from-orange-500/20 to-orange-500/5',
    bgGlow: 'bg-orange-500/10'
  },
  'no-filters': { 
    icon: Filter, 
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    bgGlow: 'bg-cyan-500/10'
  },
  'no-schedule': { 
    icon: Calendar, 
    gradient: 'from-pink-500/20 to-pink-500/5',
    bgGlow: 'bg-pink-500/10'
  },
  'no-team': { 
    icon: Users, 
    gradient: 'from-indigo-500/20 to-indigo-500/5',
    bgGlow: 'bg-indigo-500/10'
  },
  'no-analytics': { 
    icon: BarChart3, 
    gradient: 'from-teal-500/20 to-teal-500/5',
    bgGlow: 'bg-teal-500/10'
  },
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  },
};

const iconVariants = {
  floating: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  bounce: {
    y: [0, -12, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
      ease: 'easeOut',
    },
  },
  none: {},
};

// ============================================================================
// Floating Particles
// ============================================================================

function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-2 h-2 rounded-full", color)}
          initial={{ 
            x: Math.random() * 100 - 50, 
            y: Math.random() * 100 - 50,
            opacity: 0 
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
          style={{
            left: `${20 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PremiumEmptyState({
  variant = 'default',
  icon,
  title,
  description,
  actions,
  className,
  compact = false,
  animated = true,
  illustration = 'floating',
}: PremiumEmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;
  const MotionComponent = animated ? motion.div : 'div' as any;

  return (
    <MotionComponent
      variants={animated ? containerVariants : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "visible" : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 opacity-30 blur-3xl pointer-events-none",
        `bg-gradient-radial ${config.bgGlow}`
      )} />

      {/* Floating Particles */}
      {animated && illustration !== 'none' && (
        <FloatingParticles color={config.bgGlow} />
      )}

      {/* Icon Container */}
      <motion.div
        variants={animated ? itemVariants : undefined}
        className="relative z-10"
      >
        <motion.div
          animate={animated ? iconVariants[illustration] : undefined}
          className={cn(
            'relative flex items-center justify-center rounded-2xl mb-6 transition-all duration-300',
            `bg-gradient-to-br ${config.gradient}`,
            compact ? 'h-16 w-16' : 'h-24 w-24'
          )}
        >
          {/* Glow ring */}
          <div className={cn(
            "absolute inset-0 rounded-2xl opacity-50 blur-md",
            config.bgGlow
          )} />
          
          {/* Icon */}
          <Icon
            className={cn(
              'relative z-10 text-foreground/70 transition-all duration-300',
              compact ? 'h-8 w-8' : 'h-12 w-12'
            )}
          />

          {/* Decorative dots */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/30 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary/20 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={animated ? itemVariants : undefined}
        className={cn(
          'relative z-10 font-semibold text-foreground mb-2',
          compact ? 'text-base' : 'text-xl'
        )}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={animated ? itemVariants : undefined}
          className={cn(
            'relative z-10 text-muted-foreground max-w-md',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      <AnimatePresence>
        {actions && actions.length > 0 && (
          <motion.div 
            variants={animated ? itemVariants : undefined}
            className="relative z-10 flex items-center gap-3 mt-6"
          >
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={action.variant || (index === 0 ? 'default' : 'outline')}
                    onClick={action.onClick}
                    size={compact ? 'sm' : 'default'}
                    className={cn(
                      "gap-2 transition-all duration-200",
                      index === 0 && "shadow-lg shadow-primary/20"
                    )}
                  >
                    {ActionIcon && <ActionIcon className="h-4 w-4" />}
                    {action.label}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionComponent>
  );
}

// ============================================================================
// Presets
// ============================================================================

export function NoEmailsEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="no-emails"
      title="Nenhum email rastreado"
      description="Comece a rastrear seus emails para ver quando são abertos e clicados."
      actions={onAdd ? [{ label: 'Criar rastreamento', onClick: onAdd, icon: Plus }] : undefined}
      className={className}
    />
  );
}

export function NoDocumentsEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="no-documents"
      title="Nenhum documento rastreado"
      description="Faça upload de documentos para rastrear visualizações e downloads."
      actions={onAdd ? [{ label: 'Upload documento', onClick: onAdd, icon: Plus }] : undefined}
      className={className}
    />
  );
}

export function NoLinksEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="no-links"
      title="Nenhum link rastreado"
      description="Crie links rastreados para monitorar cliques e engajamento."
      actions={onAdd ? [{ label: 'Criar link', onClick: onAdd, icon: Plus }] : undefined}
      className={className}
    />
  );
}

export function NoSearchResultsEmptyState({
  searchTerm,
  onClear,
  className,
}: {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="no-results"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente termos diferentes.`
          : 'Tente ajustar os filtros ou buscar por outro termo.'
      }
      actions={onClear ? [{ label: 'Limpar busca', onClick: onClear, variant: 'outline', icon: RefreshCw }] : undefined}
      className={className}
      illustration="pulse"
    />
  );
}

export function ErrorEmptyState({
  title = 'Erro ao carregar',
  description = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="error"
      title={title}
      description={description}
      actions={onRetry ? [{ label: 'Tentar novamente', onClick: onRetry, icon: RefreshCw }] : undefined}
      className={className}
      illustration="bounce"
    />
  );
}

export function NoNotificationsEmptyState({ className }: { className?: string }) {
  return (
    <PremiumEmptyState
      variant="no-notifications"
      title="Tudo em dia!"
      description="Você não tem novas notificações no momento."
      className={className}
      compact
    />
  );
}

export function NoFiltersEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <PremiumEmptyState
      variant="no-filters"
      title="Nenhum filtro salvo"
      description="Salve seus filtros favoritos para acesso rápido."
      actions={onAdd ? [{ label: 'Salvar filtro atual', onClick: onAdd, icon: Plus }] : undefined}
      className={className}
      compact
    />
  );
}

export default PremiumEmptyState;
