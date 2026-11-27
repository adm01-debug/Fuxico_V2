import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Guarda de alterações não salvas para formulários que não usam react-hook-form.
 *
 * O app roda em `BrowserRouter` (não data router), então `useBlocker` do
 * react-router não funciona aqui. Esta versão cobre o que realmente protege
 * dados: fechar o dialog / cancelar (`confirmClose`) e fechar a aba
 * (`beforeunload`).
 *
 * Uso:
 *   const { isBlocked, confirmClose, discard, keepEditing } = useUnsavedChanges({ when: isDirty });
 *   <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : confirmClose())}>
 *   <UnsavedChangesDialog open={isBlocked} onConfirm={discard} onCancel={keepEditing} />
 */
export interface UseUnsavedChangesOptions {
  when: boolean;
  message?: string;
}

export function useUnsavedChanges({
  when,
  message = 'Você tem alterações não salvas. Deseja mesmo sair?',
}: UseUnsavedChangesOptions) {
  const [isBlocked, setIsBlocked] = useState(false);
  const whenRef = useRef(when);
  const onDiscardRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    whenRef.current = when;
  }, [when]);

  // Bloqueia fechamento/reload da aba
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Navegadores modernos ignoram o texto, mas exigem returnValue setado.
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when, message]);

  /** Chame no fechamento do dialog. Retorna `true` se pode fechar na hora. */
  const confirmClose = useCallback((onDiscard?: () => void) => {
    if (!whenRef.current) return true;
    onDiscardRef.current = onDiscard ?? (() => undefined);
    setIsBlocked(true);
    return false;
  }, []);

  /** Usuário confirmou que quer sair sem salvar. */
  const discard = useCallback(() => {
    setIsBlocked(false);
    // Limpa o estado antes de fechar para o beforeunload não disparar no unmount.
    whenRef.current = false;
    onDiscardRef.current();
  }, []);

  /** Usuário desistiu de sair. */
  const keepEditing = useCallback(() => setIsBlocked(false), []);

  return { isBlocked, confirmClose, discard, keepEditing };
}

export default useUnsavedChanges;
