import { cn } from '@/lib/utils';
import { Check, Eye, MousePointerClick, AlertTriangle, Clock, X } from 'lucide-react';

type Status = 'opened' | 'clicked' | 'bounced' | 'pending' | 'delivered' | 'failed';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<Status, { label: string; color: string; icon: typeof Check }> = {
  opened: { label: 'Aberto', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Eye },
  clicked: { label: 'Clicado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: MousePointerClick },
  bounced: { label: 'Bounce', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: AlertTriangle },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: Check },
  failed: { label: 'Falhou', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: X }
};

export function StatusBadge({ status, showIcon = true, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      config.color,
      className
    )}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {config.label}
    </span>
  );
}
