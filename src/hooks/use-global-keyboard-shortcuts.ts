import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Atalhos globais de teclado.
 * - `Esc` → voltar (se houver histórico) ou ir para `/dashboard`.
 * - `?` (Shift+/) → dispara evento `open-shortcuts-dialog`.
 * - `Ctrl/Cmd+K` → dispara evento `open-global-search`.
 *
 * Ignora quando o usuário está digitando em `input`, `textarea` ou `contenteditable`.
 */
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (el.isContentEditable) return true;
      // Radix Dialog/Popover têm role="dialog"; permitir Esc lá.
      return false;
    };

    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K → busca global (sempre ativo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-global-search"));
        return;
      }

      if (isEditable(e.target)) return;

      // `?` → mostrar atalhos
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-shortcuts-dialog"));
        return;
      }

      // Esc → voltar (fora de dialogs; dialogs consomem antes)
      if (e.key === "Escape") {
        // Se algum dialog radix estiver aberto, ele já capturou o evento (stopPropagation).
        if (window.history.length > 1) {
          navigate(-1);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}

export default useGlobalKeyboardShortcuts;
