// =============================================================================
// FUXICO - Mode Toggle Premium Component
// Arquivo: src/components/ui/mode-toggle.tsx
// Versão: 2.0 - Premium Design with Animations
// =============================================================================

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor, Sparkles } from 'lucide-react';
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
  variant?: 'default' | 'dropdown' | 'button-group' | 'premium' | 'floating';
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const themeConfig: { value: Theme; label: string; icon: React.ReactNode; shortLabel: string; gradient: string }[] = [
  { 
    value: 'light', 
    label: 'Modo Claro', 
    shortLabel: 'Claro',
    icon: <Sun className="h-4 w-4" />,
    gradient: 'from-amber-400 to-orange-500',
  },
  { 
    value: 'dark', 
    label: 'Modo Escuro', 
    shortLabel: 'Escuro',
    icon: <Moon className="h-4 w-4" />,
    gradient: 'from-indigo-500 to-purple-600',
  },
  { 
    value: 'system', 
    label: 'Sistema', 
    shortLabel: 'Auto',
    icon: <Monitor className="h-4 w-4" />,
    gradient: 'from-cyan-400 to-blue-500',
  },
];

// Animated icon component
function AnimatedThemeIcon({ theme, resolvedTheme }: { theme: Theme; resolvedTheme: 'light' | 'dark' }) {
  return (
    <div className="relative h-5 w-5">
      <AnimatePresence mode="wait">
        {theme === 'system' ? (
          <motion.div
            key="system"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Monitor className="h-5 w-5" />
          </motion.div>
        ) : resolvedTheme === 'dark' ? (
          <motion.div
            key="dark"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="h-5 w-5" />
            {/* Stars animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-2 w-2 text-yellow-300" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="light"
            initial={{ scale: 0, rotate: 180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -180, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="h-5 w-5" />
            {/* Sun rays animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center opacity-30"
            >
              <Sun className="h-7 w-7" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ModeToggle({ 
  className, 
  variant = 'default',
  showLabel = false,
  size = 'default',
}: ModeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  // Premium floating variant
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn('relative', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          animate={{
            boxShadow: isHovered
              ? '0 0 20px rgba(var(--primary), 0.4)'
              : '0 0 0px rgba(var(--primary), 0)',
          }}
          className="rounded-full"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={cn(
              sizeClasses[size],
              'rounded-full border-2 relative overflow-hidden',
              'bg-gradient-to-br from-background to-muted',
              'hover:border-primary/50 transition-all duration-300'
            )}
            aria-label="Alternar tema"
          >
            <AnimatedThemeIcon theme={theme} resolvedTheme={resolvedTheme} />
            
            {/* Glow effect */}
            <motion.div
              animate={{
                opacity: isHovered ? 0.2 : 0,
                scale: isHovered ? 1.5 : 1,
              }}
              className={cn(
                'absolute inset-0 rounded-full bg-gradient-to-r',
                resolvedTheme === 'dark' ? 'from-indigo-500 to-purple-600' : 'from-amber-400 to-orange-500'
              )}
            />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Premium variant with glow and gradient
  if (variant === 'premium') {
    const currentConfig = themeConfig.find(t => t.value === theme) || themeConfig[0];
    
    return (
      <motion.div
        className={cn('relative', className)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                sizeClasses[size],
                'rounded-xl border-2 relative overflow-hidden group',
                'bg-gradient-to-br from-background via-background to-muted',
                'hover:border-primary/50 transition-all duration-300'
              )}
              aria-label="Alternar tema"
            >
              {/* Background glow */}
              <motion.div
                className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity',
                  'bg-gradient-to-br',
                  currentConfig.gradient
                )}
              />
              
              <AnimatedThemeIcon theme={theme} resolvedTheme={resolvedTheme} />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-48 p-2 bg-background/95 backdrop-blur-lg border-border/50"
          >
            <div className="px-2 py-1.5 mb-2">
              <p className="text-xs font-medium text-muted-foreground">Aparência</p>
            </div>
            
            {themeConfig.map(({ value, label, icon, gradient }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 my-0.5',
                  'transition-all duration-200',
                  theme === value && 'bg-primary/10'
                )}
              >
                <motion.div
                  whileHover={{ rotate: value === 'light' ? 180 : value === 'dark' ? -30 : 0 }}
                  className={cn(
                    'p-1.5 rounded-lg bg-gradient-to-br',
                    gradient,
                    'text-white'
                  )}
                >
                  {icon}
                </motion.div>
                <span className="flex-1 font-medium">{label}</span>
                {theme === value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-primary"
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

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
      <div className={cn('flex items-center rounded-xl border bg-muted/50 p-1 gap-1', className)}>
        {themeConfig.map(({ value, shortLabel, icon }) => (
          <motion.div key={value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant={theme === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center gap-1.5 px-3 rounded-lg relative overflow-hidden',
                theme === value && 'shadow-md'
              )}
              aria-pressed={theme === value}
            >
              {theme === value && (
                <motion.div
                  layoutId="theme-indicator"
                  className="absolute inset-0 bg-primary/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {icon}
                {showLabel && <span className="text-xs">{shortLabel}</span>}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    );
  }

  // Variante padrão: botão simples que alterna entre light/dark/system
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
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn(sizeClasses[size], 'relative overflow-hidden', className)}
              aria-label="Alternar tema"
            >
              <AnimatedThemeIcon theme={theme} resolvedTheme={resolvedTheme} />
              <span className="sr-only">
                Tema atual: {theme === 'system' ? 'automático' : theme === 'dark' ? 'escuro' : 'claro'}
              </span>
            </Button>
          </motion.div>
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

// Componente alternativo mais simples com animação
export function ThemeToggleSimple({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className={cn('rounded-full relative overflow-hidden', className)}
        aria-label={`Mudar para modo ${resolvedTheme === 'dark' ? 'claro' : 'escuro'}`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: resolvedTheme === 'dark' ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </motion.div>
      </Button>
    </motion.div>
  );
}

export default ModeToggle;
