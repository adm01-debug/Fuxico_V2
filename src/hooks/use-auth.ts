import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/contexts/auth-context';

/**
 * Acesso tipado ao estado de autenticação.
 * @throws Error quando usado fora de `<AuthProvider>`.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
