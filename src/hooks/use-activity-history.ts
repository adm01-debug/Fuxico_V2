// FUXICO - Hook: useActivityHistory
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseActivityHistoryOptions {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
}

export function useActivityHistory({
  entityType,
  entityId,
  userId,
  limit = 50,
}: UseActivityHistoryOptions = {}) {
  return useQuery({
    queryKey: ['activity-history', entityType, entityId, userId, limit],
    queryFn: async () => {
      let query = supabase
        .from('email_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('direction', entityType);
      }
      if (entityId) {
        query = query.eq('id', entityId);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        action: item.direction,
        entity_type: 'email',
        entity_id: item.id,
        user_id: item.user_id,
        metadata: (item.metadata as Record<string, unknown>) || {},
        created_at: item.timestamp,
      })) as Activity[];
    },
  });
}

export function useEmailActivityHistory(emailId: string) {
  return useActivityHistory({ entityId: emailId });
}

export function useUserActivityHistory(userId: string) {
  return useActivityHistory({ userId, limit: 100 });
}

export default useActivityHistory;
