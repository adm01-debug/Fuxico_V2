import { useState, useCallback } from 'react';

/** Variantes visuais suportadas pelo diálogo de confirmação. */
export type DialogVariant = 'danger' | 'warning' | 'info';

/** Estado controlado e helpers para abrir/fechar o `ConfirmDialog`. */
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
