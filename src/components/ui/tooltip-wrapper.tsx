// =============================================================================
// FUXICO - Enhanced Tooltip Wrapper Component
// Tooltips com suporte a atalhos de teclado
// =============================================================================

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import { matchFirst } from "@/lib/variant";

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  shortcut?: string;
  className?: string;
  delayDuration?: number;
}

// Formatar atalho para exibição visual
function formatShortcut(shortcut: string): string[] {
  return shortcut
    .toLowerCase()
    .split('+')
    .map(key => {
      switch (key.trim()) {
        case 'alt': return '⌥';
        case 'ctrl': return '⌃';
        case 'cmd': return '⌘';
        case 'shift': return '⇧';
        case 'enter': return '↵';
        case 'esc': return 'Esc';
        case 'tab': return '⇥';
        case 'space': return '␣';
        case 'backspace': return '⌫';
        case 'delete': return '⌦';
        case 'up': return '↑';
        case 'down': return '↓';
        case 'left': return '←';
        case 'right': return '→';
        default: return key.toUpperCase();
      }
    });
}

export function TooltipWrapper({ 
  content, 
  children, 
  side = 'top', 
  shortcut,
  className,
  delayDuration = 300
}: TooltipWrapperProps) {
  const shortcutKeys = shortcut ? formatShortcut(shortcut) : [];

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent 
          side={side}
          className={cn(
            "flex items-center gap-2",
            className
          )}
        >
          <span>{content}</span>
          {shortcutKeys.length > 0 && (
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-muted rounded border border-border/50">
              {shortcutKeys.map((key, i) => (
                <span key={i} className="text-muted-foreground">
                  {key}
                </span>
              ))}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para exibir apenas o atalho
export function ShortcutBadge({ 
  shortcut, 
  className 
}: { 
  shortcut: string; 
  className?: string;
}) {
  const keys = formatShortcut(shortcut);

  return (
    <kbd className={cn(
      "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium",
      "bg-muted/80 rounded border border-border/50 text-muted-foreground",
      className
    )}>
      {keys.map((key, i) => (
        <span key={i}>{key}</span>
      ))}
    </kbd>
  );
}

import { KEYBOARD_SHORTCUTS } from './keyboard-shortcuts';

export function KeyboardShortcutsPanel() {
  return (
    <div className="space-y-4 p-4">
      {Object.entries(KEYBOARD_SHORTCUTS).map(([category, shortcuts]) => (
        <div key={category}>
          <h4 className="text-sm font-medium capitalize mb-2 text-muted-foreground">
            {matchFirst([
  [category === 'navigation', () => ('Navegação')],
  [category === 'actions', () => ('Ações')],
  [category === 'table', () => ('Tabela')],
], () => (category))}
          </h4>
          <div className="space-y-1">
            {shortcuts.map((shortcut) => (
              <div 
                key={shortcut.key} 
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <ShortcutBadge shortcut={shortcut.key} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
