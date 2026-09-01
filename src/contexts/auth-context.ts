import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';

/** Contrato exposto pelo provedor de autenticação. */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

/**
 * Contexto isolado do componente provedor para preservar o Fast Refresh:
 * arquivos que exportam componentes não devem exportar outros símbolos.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
