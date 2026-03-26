import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EmailSequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: 'manual' | 'on_open' | 'on_click' | 'on_no_response';
  settings: {
    send_on_weekends: boolean;
    send_hours_start: number;
    send_hours_end: number;
    timezone: string;
  };
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  subject: string;
  body: string;
  delay_days: number;
  delay_hours: number;
  trigger_condition: 'always' | 'if_not_opened' | 'if_not_clicked' | 'if_opened' | 'if_clicked';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  user_id: string;
  contact_email: string;
  contact_name: string | null;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed' | 'cancelled';
  enrolled_at: string;
  next_step_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SequenceStepExecution {
  id: string;
  enrollment_id: string;
  step_id: string;
  tracking_id: string | null;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmailSequences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-sequences', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailSequence[];
    },
    enabled: !!user?.id,
  });
}

export function useSequenceDetail(sequenceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-sequence', sequenceId],
    queryFn: async () => {
      if (!user?.id || !sequenceId) throw new Error('Not authenticated');

      const [sequenceResult, stepsResult, enrollmentsResult] = await Promise.all([
        supabase.from('email_sequences').select('*').eq('id', sequenceId).single(),
        supabase.from('sequence_steps').select('*').eq('sequence_id', sequenceId).order('step_order'),
        supabase.from('sequence_enrollments').select('*').eq('sequence_id', sequenceId).order('enrolled_at', { ascending: false }),
      ]);

      if (sequenceResult.error) throw sequenceResult.error;
      if (stepsResult.error) throw stepsResult.error;
      if (enrollmentsResult.error) throw enrollmentsResult.error;

      return {
        sequence: sequenceResult.data as EmailSequence,
        steps: stepsResult.data as SequenceStep[],
        enrollments: enrollmentsResult.data as SequenceEnrollment[],
      };
    },
    enabled: !!user?.id && !!sequenceId,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; trigger_type?: EmailSequence['trigger_type'] }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: sequence, error } = await supabase
        .from('email_sequences')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description || null,
          trigger_type: data.trigger_type || 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return sequence as EmailSequence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] });
      toast.success('Sequência criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar sequência: ' + error.message);
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmailSequence> & { id: string }) => {
      const { data: sequence, error } = await supabase
        .from('email_sequences')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return sequence as EmailSequence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.id] });
      toast.success('Sequência atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar sequência: ' + error.message);
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('email_sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] });
      toast.success('Sequência excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir sequência: ' + error.message);
    },
  });
}

// Steps mutations
export function useCreateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SequenceStep, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: step, error } = await supabase
        .from('sequence_steps')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return step as SequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast.success('Etapa adicionada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar etapa: ' + error.message);
    },
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SequenceStep> & { id: string }) => {
      const { data: step, error } = await supabase
        .from('sequence_steps')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return step as SequenceStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast.success('Etapa atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar etapa: ' + error.message);
    },
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequenceId }: { id: string; sequenceId: string }) => {
      const { error } = await supabase.from('sequence_steps').delete().eq('id', id);
      if (error) throw error;
      return sequenceId;
    },
    onSuccess: (sequenceId) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] });
      toast.success('Etapa removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover etapa: ' + error.message);
    },
  });
}

// Enrollments mutations
export function useEnrollContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { sequenceId: string; contactEmail: string; contactName?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Calculate next step time based on first step delay
      const { data: steps } = await supabase
        .from('sequence_steps')
        .select('delay_days, delay_hours')
        .eq('sequence_id', data.sequenceId)
        .order('step_order')
        .limit(1);

      const firstStep = steps?.[0];
      let nextStepAt = new Date();
      if (firstStep) {
        nextStepAt.setDate(nextStepAt.getDate() + (firstStep.delay_days || 0));
        nextStepAt.setHours(nextStepAt.getHours() + (firstStep.delay_hours || 0));
      }

      const { data: enrollment, error } = await supabase
        .from('sequence_enrollments')
        .insert({
          sequence_id: data.sequenceId,
          user_id: user.id,
          contact_email: data.contactEmail,
          contact_name: data.contactName || null,
          next_step_at: nextStepAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Atomic increment to prevent race conditions
      await supabase.rpc('increment_sequence_enrolled', {
        p_sequence_id: data.sequenceId
      }).then(({ error: rpcError }) => {
        // Fallback if RPC doesn't exist yet: use direct update with subquery
        if (rpcError) {
          return supabase
            .from('email_sequences')
            .update({ total_enrolled: supabase.rpc('coalesce_increment', { id: data.sequenceId }) as unknown as number })
            .eq('id', data.sequenceId);
        }
      });

      return enrollment as SequenceEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] });
      toast.success('Contato inscrito na sequência!');
    },
    onError: (error) => {
      toast.error('Erro ao inscrever contato: ' + error.message);
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string }) => {
      const { data: enrollment, error } = await supabase
        .from('sequence_enrollments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return enrollment as SequenceEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', data.sequence_id] });
      toast.success('Inscrição atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar inscrição: ' + error.message);
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sequenceId }: { id: string; sequenceId: string }) => {
      const { error } = await supabase
        .from('sequence_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      return sequenceId;
    },
    onSuccess: (sequenceId) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] });
      toast.success('Inscrição cancelada!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar inscrição: ' + error.message);
    },
  });
}
