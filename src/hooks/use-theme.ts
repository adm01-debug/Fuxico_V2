import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '@/lib/theme-context';

/**
 * Acesso tipado ao tema atual.
 * @throws Error quando usado fora de `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
