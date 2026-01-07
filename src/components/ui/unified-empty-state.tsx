import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Inbox, 
  FileX, 
  Search, 
  AlertCircle, 
  Plus,
  RefreshCw,
  type LucideIcon 
} from 'lucide-react'

type EmptyStateVariant = 'default' | 'search' | 'error' | 'no-data' | 'no-results'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  icon?: LucideIcon
}

interface UnifiedEmptyStateProps {
  variant?: EmptyStateVariant
  icon?: LucideIcon
  title: string
  description?: string
  actions?: EmptyStateAction[]
  className?: string
  compact?: boolean
}

const variantConfig: Record<EmptyStateVariant, { icon: LucideIcon; color: string }> = {
  default: { icon: Inbox, color: 'text-muted-foreground' },
  search: { icon: Search, color: 'text-muted-foreground' },
  error: { icon: AlertCircle, color: 'text-destructive' },
  'no-data': { icon: FileX, color: 'text-muted-foreground' },
  'no-results': { icon: Search, color: 'text-muted-foreground' },
}

export function UnifiedEmptyState({
  variant = 'default',
  icon,
  title,
  description,
  actions,
  className,
  compact = false,
}: UnifiedEmptyStateProps) {
  const config = variantConfig[variant]
  const Icon = icon || config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted mb-4 transition-all duration-300',
          compact ? 'h-12 w-12' : 'h-16 w-16'
        )}
      >
        <Icon
          className={cn(
            config.color,
            'transition-all duration-300',
            compact ? 'h-6 w-6' : 'h-8 w-8'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-semibold text-foreground mb-2',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground max-w-sm',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 mt-6">
          {actions.map((action, index) => {
            const ActionIcon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? 'default' : 'outline')}
                onClick={action.onClick}
                size={compact ? 'sm' : 'default'}
                className="gap-2"
              >
                {ActionIcon && <ActionIcon className="h-4 w-4" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Presets para uso comum
export function NoDataEmptyState({
  title = 'Nenhum dado encontrado',
  description = 'Ainda não há dados para exibir aqui.',
  onAdd,
  addLabel = 'Adicionar',
  className,
}: {
  title?: string
  description?: string
  onAdd?: () => void
  addLabel?: string
  className?: string
}) {
  return (
    <UnifiedEmptyState
      variant="no-data"
      title={title}
      description={description}
      actions={onAdd ? [{ label: addLabel, onClick: onAdd, icon: Plus }] : undefined}
      className={className}
    />
  )
}

export function NoSearchResultsEmptyState({
  searchTerm,
  onClear,
  className,
}: {
  searchTerm?: string
  onClear?: () => void
  className?: string
}) {
  return (
    <UnifiedEmptyState
      variant="no-results"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente ajustar sua busca.`
          : 'Tente ajustar os filtros ou buscar por outro termo.'
      }
      actions={onClear ? [{ label: 'Limpar busca', onClick: onClear, variant: 'outline' }] : undefined}
      className={className}
    />
  )
}

export function ErrorEmptyState({
  title = 'Erro ao carregar',
  description = 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <UnifiedEmptyState
      variant="error"
      title={title}
      description={description}
      actions={onRetry ? [{ label: 'Tentar novamente', onClick: onRetry, icon: RefreshCw }] : undefined}
      className={className}
    />
  )
}
