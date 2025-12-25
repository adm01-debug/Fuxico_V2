import { useCallback, useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyBindings {
  [key: string]: KeyHandler;
}

/**
 * Hook for keyboard navigation and shortcuts
 */
export function useKeyboardNavigation(bindings: KeyBindings, enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = [
      event.ctrlKey && 'ctrl',
      event.shiftKey && 'shift',
      event.altKey && 'alt',
      event.metaKey && 'meta',
      event.key.toLowerCase()
    ].filter(Boolean).join('+');

    const handler = bindings[key] || bindings[event.key.toLowerCase()];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }, [bindings, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Common keyboard shortcuts
 */
export const SHORTCUTS = {
  SEARCH: 'ctrl+k',
  SAVE: 'ctrl+s',
  NEW: 'ctrl+n',
  CLOSE: 'escape',
  NEXT: 'arrowdown',
  PREV: 'arrowup',
  SELECT: 'enter',
} as const;
