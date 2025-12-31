import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_THRESHOLD_MS = 30 * 60 * 1000; // Refresh when 30 min left

export interface ActiveSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, unknown>;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export function useSession() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active sessions
  const { data: activeSessions, isLoading } = useQuery({
    queryKey: ['activeSessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as ActiveSession[];
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  // Register/update current session
  const registerSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !session?.access_token) return null;

      const sessionToken = session.access_token.substring(0, 50); // Use part of token as identifier
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      };

      const { data, error } = await supabase
        .from('active_sessions')
        .upsert({
          user_id: user.id,
          session_token: sessionToken,
          user_agent: navigator.userAgent,
          device_info: deviceInfo,
          last_activity_at: new Date().toISOString(),
          expires_at: expiresAt,
        }, {
          onConflict: 'session_token',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      // Update session activity
      registerSessionMutation.mutate();
      
      return data;
    } catch (err: any) {
      console.error('Session refresh failed:', err);
      return null;
    }
  }, [registerSessionMutation]);

  // Terminate session
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Sessão encerrada');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao encerrar sessão');
    },
  });

  // Terminate all other sessions
  const terminateAllOtherMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !session?.access_token) return;

      const currentToken = session.access_token.substring(0, 50);

      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('session_token', currentToken);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Todas as outras sessões foram encerradas');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao encerrar sessões');
    },
  });

  // Auto-refresh session when needed
  useEffect(() => {
    if (!session?.expires_at) return;

    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Refresh if within threshold
    if (timeUntilExpiry < REFRESH_THRESHOLD_MS && timeUntilExpiry > 0) {
      refreshSession();
    }

    // Set up timer for next refresh
    const refreshTime = Math.max(0, timeUntilExpiry - REFRESH_THRESHOLD_MS);
    const timer = setTimeout(refreshSession, refreshTime);

    return () => clearTimeout(timer);
  }, [session?.expires_at, refreshSession]);

  // Register session on mount
  useEffect(() => {
    if (user?.id) {
      registerSessionMutation.mutate();
    }
  }, [user?.id]);

  // Update activity periodically
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      registerSessionMutation.mutate();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    activeSessions: activeSessions || [],
    isLoading,
    refreshSession,
    terminateSession: terminateSessionMutation.mutate,
    terminateAllOther: terminateAllOtherMutation.mutate,
    isTerminating: terminateSessionMutation.isPending || terminateAllOtherMutation.isPending,
  };
}
