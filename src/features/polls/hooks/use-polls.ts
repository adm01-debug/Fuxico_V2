import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export type PollStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  votes_count: number;
  sort_order: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_name: string | null;
  voter_email: string | null;
  created_at: string;
}

export interface Poll {
  id: string;
  user_id: string;
  question: string;
  status: PollStatus;
  allow_multiple_votes: boolean;
  expires_at: string | null;
  total_votes: number;
  created_at: string;
  updated_at: string;
  options: PollOption[];
}

export interface CreatePollInput {
  question: string;
  options: string[];
  allowMultipleVotes: boolean;
  expiresAt?: string | null;
}

export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativa',
  closed: 'Encerrada',
  archived: 'Arquivada',
};

export const POLL_STATUS_VARIANTS: Record<
  PollStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'outline',
  active: 'default',
  closed: 'secondary',
  archived: 'destructive',
};

export function buildPollUrl(pollId: string): string {
  if (typeof window === 'undefined') return `/poll/${pollId}`;
  return `${window.location.origin}/poll/${pollId}`;
}

export function isPollExpired(poll: Pick<Poll, 'expires_at'>): boolean {
  if (!poll.expires_at) return false;
  return new Date(poll.expires_at).getTime() < Date.now();
}

export function pollVoteTotal(poll: Poll): number {
  return poll.options.reduce((total, option) => total + option.votes_count, 0);
}

function groupOptionsByPoll(rows: PollOption[]): Map<string, PollOption[]> {
  const grouped = new Map<string, PollOption[]>();
  rows.forEach((row) => {
    const bucket = grouped.get(row.poll_id);
    if (bucket) {
      bucket.push(row);
      return;
    }
    grouped.set(row.poll_id, [row]);
  });
  return grouped;
}

/** Enquetes do usuário com as opções e a contagem de votos de cada uma. */
export function usePolls() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['polls', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Poll[]> => {
      const { data: polls, error } = await supabase
        .from('polls')
        .select(
          'id, user_id, question, status, allow_multiple_votes, expires_at, total_votes, created_at, updated_at'
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!polls || polls.length === 0) return [];

      const { data: options, error: optionsError } = await supabase
        .from('poll_options')
        .select('id, poll_id, label, votes_count, sort_order')
        .in(
          'poll_id',
          polls.map((poll) => poll.id)
        )
        .order('sort_order', { ascending: true });
      if (optionsError) throw optionsError;

      const grouped = groupOptionsByPoll((options ?? []) as PollOption[]);
      return polls.map((poll) => ({
        ...poll,
        status: poll.status as PollStatus,
        options: grouped.get(poll.id) ?? [],
      }));
    },
  });
}

/** Votos individuais de uma enquete (quem votou e quando). */
export function usePollVotes(pollId: string | null) {
  return useQuery({
    queryKey: ['poll-votes', pollId],
    enabled: !!pollId,
    queryFn: async (): Promise<PollVote[]> => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('id, poll_id, option_id, voter_name, voter_email, created_at')
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PollVote[];
    },
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePollInput) => {
      if (!user) throw new Error('Sessão expirada');
      const labels = input.options.map((label) => label.trim()).filter(Boolean);
      if (!input.question.trim()) throw new Error('Informe a pergunta da enquete');
      if (labels.length < 2) throw new Error('Informe pelo menos duas opções');

      const { data: poll, error } = await supabase
        .from('polls')
        .insert({
          user_id: user.id,
          question: input.question.trim(),
          status: 'active',
          allow_multiple_votes: input.allowMultipleVotes,
          expires_at: input.expiresAt ?? null,
          options: [],
        })
        .select('id')
        .single();
      if (error) throw error;

      const { error: optionsError } = await supabase.from('poll_options').insert(
        labels.map((label, index) => ({
          poll_id: poll.id,
          label,
          sort_order: index,
        }))
      );
      if (optionsError) {
        await supabase.from('polls').delete().eq('id', poll.id);
        throw optionsError;
      }

      return poll.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });
}

export function useUpdatePollStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pollId, status }: { pollId: string; status: PollStatus }) => {
      const { error } = await supabase.from('polls').update({ status }).eq('id', pollId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });
}

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pollId: string) => {
      const { error } = await supabase.from('polls').delete().eq('id', pollId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });
}
