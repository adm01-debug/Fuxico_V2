import { useContext } from 'react';
import {
  AccessibilityContext,
  type AccessibilityContextType,
} from '@/contexts/accessibility-context';

/**
 * Acesso tipado às preferências de acessibilidade.
 * @throws Error quando usado fora de `<AccessibilityProvider>`.
 */
export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
