import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  format: 'email' | 'pdf' | 'csv';
  enabled: boolean;
  recipients: string[];
  metrics: string[];
  last_sent_at: string | null;
  next_send_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  name: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  format: 'email' | 'pdf' | 'csv';
  recipients: string[];
  metrics: string[];
}

export interface UpdateReportData extends Partial<CreateReportData> {
  id: string;
  enabled?: boolean;
}

function calculateNextSend(reportType: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date();
  switch (reportType) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
      break;
    case 'weekly':
      now.setDate(now.getDate() + (7 - now.getDay() + 1)); // Next Monday
      now.setHours(8, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(8, 0, 0, 0);
      break;
  }
  return now.toISOString();
}

export function useScheduledReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading, error } = useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['scheduled-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ScheduledReport[];
    },
    enabled: !!user?.id,
  });

  const createReport = useMutation({
    mutationFn: async (reportData: CreateReportData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const nextSend = calculateNextSend(reportData.report_type);
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: user.id,
          name: reportData.name,
          report_type: reportData.report_type,
          format: reportData.format,
          recipients: reportData.recipients,
          metrics: reportData.metrics,
          next_send_at: nextSend,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Relatório agendado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar relatório', { description: error.message });
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateReportData) => {
      const update: Record<string, unknown> = { ...updateData };
      
      // Recalculate next send if type changes
      if (updateData.report_type) {
        update.next_send_at = calculateNextSend(updateData.report_type);
      }
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Relatório atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar relatório', { description: error.message });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Relatório removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover relatório', { description: error.message });
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Configuração atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar', { description: error.message });
    },
  });

  const addRecipient = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const report = reports.find(r => r.id === id);
      if (!report) throw new Error('Relatório não encontrado');
      
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ recipients: [...report.recipients, email] })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Destinatário adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar destinatário', { description: error.message });
    },
  });

  const removeRecipient = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const report = reports.find(r => r.id === id);
      if (!report) throw new Error('Relatório não encontrado');
      
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ recipients: report.recipients.filter(e => e !== email) })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error) => {
      toast.error('Erro ao remover destinatário', { description: error.message });
    },
  });

  return {
    reports,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    toggleEnabled,
    addRecipient,
    removeRecipient,
  };
}

