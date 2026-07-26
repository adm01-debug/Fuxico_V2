import { createContext } from 'react';

/** Preferências de tema suportadas. */
export type Theme = 'light' | 'dark' | 'system';
/** Tema efetivamente aplicado após resolver `system`. */
export type ResolvedTheme = 'light' | 'dark';

/** Contrato exposto pelo `ThemeProvider`. */
export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

/** Contexto isolado do provedor para preservar o Fast Refresh. */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
