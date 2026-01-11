// =============================================================================
// FUXICO - Sequence Webhook Execution Logs Hook
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SequenceWebhookLog {
  id: string;
  event_type: string;
  success: boolean;
  response_status?: number;
  error?: string;
  payload?: {
    processed?: number;
    errors?: number;
    message?: string;
    enrollments_due?: number;
  };
  created_at: string;
}

export function useSequenceWebhookLogs(limit = 20) {
  return useQuery<SequenceWebhookLog[]>({
    queryKey: ['sequence-webhook-logs', limit],
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('webhook_logs')
        .select('id, event_type, success, response_status, error, payload, created_at')
        .eq('user_id', user.id)
        .eq('event_type', 'sequence_processing')
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data || []) as SequenceWebhookLog[];
    },
  });
}
