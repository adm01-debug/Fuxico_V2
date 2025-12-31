// FUXICO - Component: BulkActionsBar
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Download, Copy, X } from 'lucide-react';
import { BulkAction } from '@/hooks/use-bulk-actions';

interface BulkActionsBarProps {
  selectedCount: number;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
  isProcessing?: boolean;
  availableActions?: BulkAction[];
}

const actionConfig: Record<BulkAction, { icon: typeof Trash2; label: string; variant: 'default' | 'destructive' | 'outline' }> = {
  delete: { icon: Trash2, label: 'Excluir', variant: 'destructive' },
  restore: { icon: RotateCcw, label: 'Restaurar', variant: 'outline' },
  export: { icon: Download, label: 'Exportar', variant: 'outline' },
  duplicate: { icon: Copy, label: 'Duplicar', variant: 'outline' },
  archive: { icon: Trash2, label: 'Arquivar', variant: 'outline' },
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium px-2">
        {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
      </span>
      
      <div className="h-4 w-px bg-border" />
      
      <div className="flex gap-2">
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
            >
              <Icon className="h-4 w-4 mr-1" />
              {config.label}
            </Button>
          );
        })}
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <Button variant="ghost" size="sm" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default BulkActionsBar;
