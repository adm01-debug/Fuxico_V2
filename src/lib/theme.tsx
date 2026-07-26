// =============================================================================
// FUXICO - Sistema de Temas (Dark Mode)
// Arquivo: src/lib/theme.tsx
// =============================================================================

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback 
} from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { matchFirst } from "@/lib/variant";

// =============================================================================
// TIPOS
// =============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// =============================================================================
// CONTEXTO
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: 'class' | 'data-theme';
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'fuxico-theme',
  attribute = 'class',
  disableTransitionOnChange = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  // Initialize resolvedTheme correctly to match the FOUC script and avoid flash
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      const t = stored && ['light', 'dark', 'system'].includes(stored) ? stored : defaultTheme;
      if (t === 'dark') return 'dark';
      if (t === 'light') return 'light';
      // system
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const resolveTheme = useCallback((themeToResolve: Theme): ResolvedTheme => {
    if (themeToResolve === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? 'dark' 
          : 'light';
      }
      return 'light';
    }
    return themeToResolve;
  }, []);

  const applyTheme = useCallback((resolvedThemeValue: ResolvedTheme) => {
    const root = window.document.documentElement;
    
    if (disableTransitionOnChange) {
      root.style.setProperty('--transition-duration', '0s');
    }
    
    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedThemeValue);
    } else {
      root.setAttribute('data-theme', resolvedThemeValue);
    }
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedThemeValue === 'dark' ? '#1a1a2e' : '#ffffff'
      );
    }
    
    if (disableTransitionOnChange) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.style.removeProperty('--transition-duration');
        });
      });
    }
  }, [attribute, disableTransitionOnChange]);

  // Apply theme whenever theme preference changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    localStorage.setItem(storageKey, theme);
  }, [theme, resolveTheme, applyTheme, storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, resolveTheme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(current => {
      if (current === 'system') {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [resolvedTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// =============================================================================
// COMPONENTES
// =============================================================================

export function ThemeToggle({ 
  className = '',
  showLabel = false,
}: { 
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = matchFirst([
  [theme === 'system', () => (Monitor)],
  [isDark, () => (Moon)],
], () => (Sun));
  const label = matchFirst([
  [theme === 'system', () => ('Sistema')],
  [isDark, () => ('Escuro')],
], () => ('Claro'));

  return (
    <button
      onClick={cycleTheme}
      className={`inline-flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors ${className}`}
      aria-label={`Tema atual: ${label}. Clique para alternar.`}
      title={`Tema: ${label}`}
    >
      <Icon className="h-5 w-5" />
      {showLabel && <span className="text-sm">{label}</span>}
    </button>
  );
}

export function ThemeSelector({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Escuro', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className={`flex gap-1 p-1 bg-muted rounded-lg ${className}`}>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors
            ${theme === option.value 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
          aria-pressed={theme === option.value}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

