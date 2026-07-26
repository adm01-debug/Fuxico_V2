import { useEffect, useState } from 'react';

/** Controla a abertura da busca global via Alt+F ou Ctrl/Cmd+K. */
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+F to open global search
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setOpen(true);
      }
      // Also support Cmd/Ctrl+K as common pattern
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
