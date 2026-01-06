import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailAuditLog {
  id: string;
  user_id: string;
  user_email: string;
  direction: 'sent' | 'received';
  recipient_email: string | null;
  sender_email: string | null;
  subject: string | null;
  timestamp: string;
  is_external: boolean;
  external_domain: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FraudAlert {
  id: string;
  user_id: string;
  user_email: string;
  alert_type: 'suspicious_hours' | 'external_recipient' | 'volume_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  email_audit_log_id: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuditStats {
  totalSent: number;
  totalReceived: number;
  externalEmails: number;
  unresolvedAlerts: number;
  userCount: number;
}

// Check if current user is admin
/**
 * Hook para verificar se usuário é administrador
 * @description Verifica se o usuário atual tem role de admin
 * @returns {Object} { data: boolean, isLoading: boolean }
 * @example
 * const { data: isAdmin } = useIsAdmin();
 */
export function useIsAdmin() {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        
        return false;
      }

      return !!data;
    },
  });
}

// Fetch audit logs (admin sees all, user sees own)
/**
 * Hook para buscar logs de auditoria de emails
 * @description Recupera logs de emails enviados/recebidos com filtros
 * @param {Object} options - Opções de filtro (direction, dateRange)
 * @returns {Object} { data: EmailAuditLog[], isLoading, error }
 * @example
 * const { data: logs } = useEmailAuditLogs({ direction: 'sent' });
 */
export function useEmailAuditLogs(filters?: {
  userId?: string;
  direction?: 'sent' | 'received';
  startDate?: Date;
  endDate?: Date;
  isExternal?: boolean;
}) {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['email-audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('email_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      if (filters?.isExternal !== undefined) {
        query = query.eq('is_external', filters.isExternal);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmailAuditLog[];
    },
  });
}

// Fetch fraud alerts (admin only)
/**
 * Hook para buscar alertas de fraude
 * @description Recupera alertas de atividades suspeitas
 * @param {boolean} includeResolved - Incluir alertas resolvidos
 * @returns {Object} { data: FraudAlert[], isLoading }
 * @example
 * const { data: alerts } = useFraudAlerts(false);
 */
export function useFraudAlerts(showResolved = false) {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['fraud-alerts', showResolved],
    queryFn: async () => {
      let query = supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showResolved) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FraudAlert[];
    },
  });
}

// Resolve a fraud alert
/**
 * Hook para resolver alertas de fraude
 * @description Marca um alerta como resolvido
 * @returns {Object} Mutation para resolver alertas
 * @example
 * const { mutate: resolve } = useResolveAlert();
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('fraud_alerts')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
    },
  });
}

// Get audit statistics
/**
 * Hook para estatísticas de auditoria
 * @description Retorna métricas agregadas de emails
 * @returns {Object} { data: AuditStats, isLoading }
 * @example
 * const { data: stats } = useAuditStats();
 */
export function useAuditStats() {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get sent count
      const { count: sentCount } = await supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'sent')
        .gte('timestamp', today.toISOString());

      // Get received count
      const { count: receivedCount } = await supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'received')
        .gte('timestamp', today.toISOString());

      // Get external count
      const { count: externalCount } = await supabase
        .from('email_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('is_external', true)
        .gte('timestamp', today.toISOString());

      // Get unresolved alerts
      const { count: alertCount } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      // Get unique users today
      const { data: uniqueUsers } = await supabase
        .from('email_audit_logs')
        .select('user_id')
        .gte('timestamp', today.toISOString());

      const userCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

      return {
        totalSent: sentCount || 0,
        totalReceived: receivedCount || 0,
        externalEmails: externalCount || 0,
        unresolvedAlerts: alertCount || 0,
        userCount,
      } as AuditStats;
    },
  });
}

// Get user activity summary
/**
 * Hook para resumo de atividade de usuários
 * @description Retorna atividade por usuário no período
 * @returns {Object} { data: UserActivity[], isLoading }
 * @example
 * const { data: activity } = useUserActivitySummary();
 */
export function useUserActivitySummary() {
  return useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['user-activity-summary'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('email_audit_logs')
        .select('user_id, user_email, direction')
        .gte('timestamp', today.toISOString());

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, {
        user_id: string;
        user_email: string;
        sent: number;
        received: number;
      }>();

      data?.forEach(log => {
        const existing = userMap.get(log.user_id) || {
          user_id: log.user_id,
          user_email: log.user_email,
          sent: 0,
          received: 0,
        };

        if (log.direction === 'sent') {
          existing.sent++;
        } else {
          existing.received++;
        }

        userMap.set(log.user_id, existing);
      });

      return Array.from(userMap.values()).sort((a, b) => 
        (b.sent + b.received) - (a.sent + a.received)
      );
    },
  });
}
