import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReauthAction = 
  | 'change_password'
  | 'change_email'
  | 'configure_mfa'
  | 'admin_action'
  | 'delete_account'
  | 'sensitive_data';

const REAUTH_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useReauthentication() {
  const { user } = useAuth();
  const [lastReauthAt, setLastReauthAt] = useState<number | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const needsReauthentication = useCallback((action: ReauthAction): boolean => {
    // Actions that always require reauth
    const sensitiveActions: ReauthAction[] = [
      'change_password',
      'change_email',
      'configure_mfa',
      'admin_action',
      'delete_account',
    ];

    if (!sensitiveActions.includes(action)) {
      return false;
    }

    // Check if recently reauthenticated
    if (lastReauthAt && Date.now() - lastReauthAt < REAUTH_DURATION_MS) {
      return false;
    }

    return true;
  }, [lastReauthAt]);

  const reauthenticate = useCallback(async (password: string): Promise<boolean> => {
    if (!user?.email) {
      toast.error('Usuário não encontrado');
      return false;
    }

    setIsReauthenticating(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        toast.error('Senha incorreta');
        return false;
      }

      setLastReauthAt(Date.now());
      
      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: user.id,
        _event_type: 'reauthentication',
        _severity: 'info',
        _description: 'Usuário reautenticado com sucesso',
      });

      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erro na reautenticação');
      return false;
    } finally {
      setIsReauthenticating(false);
    }
  }, [user]);

  const withReauthentication = useCallback(async <T>(
    action: ReauthAction,
    callback: () => Promise<T>,
    password?: string
  ): Promise<T | null> => {
    if (needsReauthentication(action)) {
      if (!password) {
        toast.error('Reautenticação necessária');
        return null;
      }

      const success = await reauthenticate(password);
      if (!success) return null;
    }

    return callback();
  }, [needsReauthentication, reauthenticate]);

  return {
    needsReauthentication,
    reauthenticate,
    withReauthentication,
    isReauthenticating,
    lastReauthAt,
  };
}
