// =============================================================================
// FUXICO - Component: KeyboardShortcutsDialog
// Shows all keyboard shortcuts available in the dashboard
// =============================================================================


// FUXICO - Keyboard Shortcuts Dialog
// Painel de atalhos de teclado disponíveis
// =============================================================================

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Navigation, MousePointerClick, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

// Formatar tecla para exibição visual
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'alt': '⌥ Alt',
    'ctrl': '⌃ Ctrl',
    'cmd': '⌘ Cmd',
    'shift': '⇧ Shift',
    'enter': '↵ Enter',
    'esc': 'Esc',
    'tab': '⇥ Tab',
    'space': '␣ Space',
    'backspace': '⌫',
    'delete': '⌦',
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
  };
  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

function ShortcutKey({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split('+').map(k => k.trim());
  
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className={cn(
            "inline-flex items-center justify-center min-w-[28px] h-7 px-2",
            "text-xs font-medium rounded border",
            "bg-muted/80 border-border/50 text-foreground",
            "shadow-sm"
          )}
        >
          {formatKey(key)}
        </kbd>
      ))}
    </div>
  );
}

interface ShortcutCategory {
  title: string;
  icon: React.ReactNode;
  shortcuts: Array<{ key: string; description: string }>;
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Navegação',
    icon: <Navigation className="h-4 w-4" />,
    shortcuts: [
      { key: 'Alt+H', description: 'Ir para Home' },
      { key: 'Alt+E', description: 'Ir para Emails' },
      { key: 'Alt+A', description: 'Ir para Analytics' },
      { key: 'Alt+L', description: 'Ir para Lead Scoring' },
      { key: 'Alt+S', description: 'Ir para Configurações' },
    ],
  },
  {
    title: 'Ações',
    icon: <MousePointerClick className="h-4 w-4" />,
    shortcuts: [
      { key: 'Alt+F', description: 'Busca global' },
      { key: 'Ctrl+K', description: 'Busca global (alternativo)' },
      { key: 'Alt+N', description: 'Novo rastreamento' },
      { key: 'Alt+R', description: 'Atualizar dados' },
      { key: 'Esc', description: 'Fechar modal/dialog' },
      { key: '?', description: 'Mostrar atalhos' },
    ],
  },
  {
    title: 'Tabelas',
    icon: <Table className="h-4 w-4" />,
    shortcuts: [
      { key: 'Up', description: 'Linha anterior' },
      { key: 'Down', description: 'Próxima linha' },
      { key: 'Enter', description: 'Abrir detalhes' },
      { key: 'Space', description: 'Selecionar linha' },
      { key: 'Ctrl+A', description: 'Selecionar todos' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1.5">
                  {category.icon}
                  {category.title}
                </Badge>
              </div>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <ShortcutKey shortcut={shortcut.key} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Pressione <ShortcutKey shortcut="?" /> a qualquer momento para ver este painel
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para abrir o painel com "?"
export function useKeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver em input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}

export default KeyboardShortcutsDialog;
