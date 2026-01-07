// FUXICO - Component: BulkActionsBar
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Download, Copy, X, Archive } from 'lucide-react';
import { BulkAction } from '@/hooks/use-bulk-actions';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
  isProcessing?: boolean;
  availableActions?: BulkAction[];
}

const actionConfig: Record<BulkAction, { icon: typeof Trash2; label: string; shortLabel: string; variant: 'default' | 'destructive' | 'outline' }> = {
  delete: { icon: Trash2, label: 'Excluir', shortLabel: 'Excluir', variant: 'destructive' },
  restore: { icon: RotateCcw, label: 'Restaurar', shortLabel: 'Rest.', variant: 'outline' },
  export: { icon: Download, label: 'Exportar', shortLabel: 'Exp.', variant: 'outline' },
  duplicate: { icon: Copy, label: 'Duplicar', shortLabel: 'Dup.', variant: 'outline' },
  archive: { icon: Archive, label: 'Arquivar', shortLabel: 'Arq.', variant: 'outline' },
};

export function BulkActionsBar({
  selectedCount,
  onAction,
  onClear,
  isProcessing = false,
  availableActions = ['delete', 'export'],
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "bg-background border rounded-lg shadow-lg",
        "p-2 sm:p-3 flex items-center gap-2 sm:gap-3",
        "animate-in slide-in-from-bottom-4",
        "max-w-[calc(100vw-2rem)] w-auto",
        // Safe area for mobile devices with home indicator
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      )}
    >
      {/* Selection count badge */}
      <span className="text-xs sm:text-sm font-medium px-2 whitespace-nowrap">
        <span className="font-bold">{selectedCount}</span>
        <span className="hidden xs:inline"> selecionado{selectedCount > 1 ? 's' : ''}</span>
      </span>
      
      <div className="h-4 w-px bg-border flex-shrink-0" />
      
      {/* Action buttons - horizontal scroll on mobile */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        {availableActions.map(action => {
          const config = actionConfig[action];
          const Icon = config.icon;
          return (
            <Button
              key={action}
              variant={config.variant}
              size="sm"
              onClick={() => onAction(action)}
              disabled={isProcessing}
              className={cn(
                "h-10 sm:h-9 min-w-10 px-2.5 sm:px-3",
                "flex-shrink-0 gap-1 sm:gap-1.5",
                "text-xs sm:text-sm"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {/* Show short label on xs, full label on sm+ */}
              <span className="hidden xs:inline sm:hidden">{config.shortLabel}</span>
              <span className="hidden sm:inline">{config.label}</span>
            </Button>
          );
        })}
      </div>
      
      <div className="h-4 w-px bg-border flex-shrink-0" />
      
      {/* Clear button - always visible with 44px touch target */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClear}
        className="h-10 w-10 sm:h-9 sm:w-9 p-0 flex-shrink-0"
        aria-label="Limpar seleção"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default BulkActionsBar;
