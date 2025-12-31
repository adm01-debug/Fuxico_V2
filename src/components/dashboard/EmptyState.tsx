// FUXICO - Component: EmptyState
import { LucideIcon, Inbox, Search, Filter, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateType = 'no-data' | 'no-results' | 'no-filters' | 'error';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultStates: Record<EmptyStateType, { icon: LucideIcon; title: string; description: string }> = {
  'no-data': {
    icon: Inbox,
    title: 'Nenhum dado',
    description: 'Ainda nao ha registros para exibir.',
  },
  'no-results': {
    icon: Search,
    title: 'Nenhum resultado',
    description: 'Nenhum registro encontrado com os filtros aplicados.',
  },
  'no-filters': {
    icon: Filter,
    title: 'Nenhum filtro salvo',
    description: 'Salve seus filtros para acesso rapido.',
  },
  'error': {
    icon: FileX,
    title: 'Erro ao carregar',
    description: 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  },
};

export function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  const defaults = defaultStates[type];
  const Icon = icon || defaults.icon;
  const displayTitle = title || defaults.title;
  const displayDescription = description || defaults.description;

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{displayDescription}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
