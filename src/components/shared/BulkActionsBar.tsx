// =============================================================================
// FUXICO - Component: BulkActionsBar
// Barra de ações em massa para itens selecionados
// =============================================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Trash2,
  Archive,
  RotateCcw,
  Copy,
  X,
  Loader2,
  CheckSquare,
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDuplicate?: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
  isArchiving?: boolean;
  isRestoring?: boolean;
  isDuplicating?: boolean;
  showDelete?: boolean;
  showArchive?: boolean;
  showRestore?: boolean;
  showDuplicate?: boolean;
  entityName?: string;
}

export function BulkActionsBar({
  selectedCount,
  onDelete,
  onArchive,
  onRestore,
  onDuplicate,
  onClearSelection,
  isDeleting = false,
  isArchiving = false,
  isRestoring = false,
  isDuplicating = false,
  showDelete = true,
  showArchive = false,
  showRestore = false,
  showDuplicate = false,
  entityName = 'item',
}: BulkActionsBarProps) {
  const [confirmAction, setConfirmAction] = useState<'delete' | 'archive' | null>(null);

  if (selectedCount === 0) return null;

  const pluralName = selectedCount === 1 ? entityName : `${entityName}s`;
  const isLoading = isDeleting || isArchiving || isRestoring || isDuplicating;

  const handleConfirmAction = () => {
    if (confirmAction === 'delete' && onDelete) {
      onDelete();
    } else if (confirmAction === 'archive' && onArchive) {
      onArchive();
    }
    setConfirmAction(null);
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-2 pr-4 border-r">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedCount} {pluralName} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {showRestore && onRestore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestore}
                disabled={isLoading}
              >
                {isRestoring ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Restaurar</span>
              </Button>
            )}

            {showDuplicate && onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                disabled={isLoading}
              >
                {isDuplicating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Duplicar</span>
              </Button>
            )}

            {showArchive && onArchive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction('archive')}
                disabled={isLoading}
              >
                {isArchiving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Arquivar</span>
              </Button>
            )}

            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmAction('delete')}
                disabled={isLoading}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Excluir</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              disabled={isLoading}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' ? 'Excluir' : 'Arquivar'} {selectedCount} {pluralName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete'
                ? 'Esta ação pode ser desfeita posteriormente restaurando os itens.'
                : 'Os itens arquivados podem ser restaurados posteriormente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmAction === 'delete' ? 'Excluir' : 'Arquivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
