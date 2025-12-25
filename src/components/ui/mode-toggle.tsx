// =============================================================================
// FUXICO - Mode Toggle Component
// Arquivo: src/components/ui/mode-toggle.tsx
// =============================================================================

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  className?: string;
  variant?: 'default' | 'dropdown' | 'button-group';
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const themeConfig: { value: Theme; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { 
    value: 'light', 
    label: 'Modo Claro', 
    shortLabel: 'Claro',
    icon: <Sun className="h-4 w-4" /> 
  },
  { 
    value: 'dark', 
    label: 'Modo Escuro', 
    shortLabel: 'Escuro',
    icon: <Moon className="h-4 w-4" /> 
  },
  { 
    value: 'system', 
    label: 'Sistema', 
    shortLabel: 'Auto',
    icon: <Monitor className="h-4 w-4" /> 
  },
];

export function ModeToggle({ 
  className, 
  variant = 'default',
  showLabel = false,
  size = 'default',
}: ModeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  // Variante padrão com dropdown
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(sizeClasses[size], className)}
                  aria-label="Alternar tema"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar tema</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alternar tema ({theme === 'system' ? 'automático' : theme === 'dark' ? 'escuro' : 'claro'})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          {themeConfig.map(({ value, label, icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {icon}
              <span>{label}</span>
              {theme === value && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Variante com grupo de botões
  if (variant === 'button-group') {
    return (
      <div className={cn('flex items-center rounded-lg border bg-muted p-1', className)}>
        {themeConfig.map(({ value, shortLabel, icon }) => (
          <Button
            key={value}
            variant={theme === value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center gap-1.5 px-3',
              theme === value && 'shadow-sm'
            )}
            aria-pressed={theme === value}
          >
            {icon}
            {showLabel && <span className="text-xs">{shortLabel}</span>}
          </Button>
        ))}
      </div>
    );
  }

  // Variante padrão: botão simples que alterna entre light/dark
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(sizeClasses[size], className)}
            aria-label="Alternar tema"
          >
            {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
            {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
            {theme === 'system' && <Monitor className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">
              Tema atual: {theme === 'system' ? 'automático' : theme === 'dark' ? 'escuro' : 'claro'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {theme === 'light' && 'Clique para modo escuro'}
            {theme === 'dark' && 'Clique para modo automático'}
            {theme === 'system' && 'Clique para modo claro'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente alternativo mais simples
export function ThemeToggleSimple({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn('rounded-full', className)}
      aria-label={`Mudar para modo ${resolvedTheme === 'dark' ? 'claro' : 'escuro'}`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export default ModeToggle;
