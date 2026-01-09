// FUXICO - Component: ConfirmDialog
import { AlertTriangle, Trash2, Info } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: DialogVariant;
  isLoading?: boolean;
}

const variantConfig: Record<DialogVariant, { icon: typeof AlertTriangle; color: string }> = {
  danger: { icon: Trash2, color: 'text-destructive' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  info: { icon: Info, color: 'text-blue-500' },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div role="region" aria-label="Dialog de Confirmação" className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={variant === 'danger' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook para facilitar uso
import { useState, useCallback } from 'react';

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: DialogVariant;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const confirm = useCallback((options: {
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: DialogVariant;
  }) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      onConfirm: options.onConfirm,
      variant: options.variant || 'danger',
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  return {
    ...state,
    confirm,
    close,
    setOpen: (open: boolean) => setState(prev => ({ ...prev, open })),
  };
}

export default ConfirmDialog;
