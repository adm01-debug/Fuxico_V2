import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Hook para prevenir perda de dados em formulários com alterações pendentes.
 * - Bloqueia navegação interna via react-router (`useBlocker`).
 * - Bloqueia fechamento/reload da aba via `beforeunload`.
 *
 * O consumidor decide se confirma via `confirm()` nativo ou dialog custom
 * (retorne `true` para permitir a saída).
 */
export interface UseUnsavedChangesOptions {
  when: boolean;
  message?: string;
  /** Handler assíncrono para dialog customizado. Se omitido, usa `window.confirm`. */
  onConfirm?: () => Promise<boolean> | boolean;
}

export function useUnsavedChanges({
  when,
  message = "Você tem alterações não salvas. Deseja mesmo sair?",
  onConfirm,
}: UseUnsavedChangesOptions) {
  const messageRef = useRef(message);
  messageRef.current = message;

  // Bloqueia navegação SPA
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!when) return false;
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    (async () => {
      const ok = onConfirm
        ? await onConfirm()
        : window.confirm(messageRef.current);
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
  }, [blocker, onConfirm]);

  // Bloqueia fechamento/reload
  useEffect(() => {
    if (!when) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Navegadores modernos ignoram o texto, mas exigem returnValue setado.
      e.returnValue = messageRef.current;
      return messageRef.current;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);

  const confirmNavigation = useCallback(() => {
    if (blocker.state === "blocked") blocker.proceed();
  }, [blocker]);
  const cancelNavigation = useCallback(() => {
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  return {
    isBlocked: blocker.state === "blocked",
    confirmNavigation,
    cancelNavigation,
  };
}

export default useUnsavedChanges;
