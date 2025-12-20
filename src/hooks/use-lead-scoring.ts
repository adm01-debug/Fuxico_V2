// =============================================================================
// FUXICO - Lead Scoring Hook
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContactScore {
  id: string;
  email: string;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  unique_opens: number;
  first_interaction_at: string | null;
  last_interaction_at: string | null;
  engagement_score: number;
  score_level: 'hot' | 'warm' | 'cool' | 'cold';
  created_at: string;
  updated_at: string;
}

export function useContactScores() {
  return useQuery<ContactScore[]>({
    queryKey: ['contact-scores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contact_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('engagement_score', { ascending: false });

      if (error) throw error;
      return (data || []) as ContactScore[];
    },
  });
}

export function useRecalculateScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('recalculate_all_contact_scores', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-scores'] });
    },
  });
}

export function useUpdateContactScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('update_contact_score', {
        p_user_id: user.id,
        p_email: email,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-scores'] });
    },
  });
}
