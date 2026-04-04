/** Hook para templates de email */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  body: string;
  category: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string;
}

export function useEmailTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          category: templateData.category,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar template', { description: error.message });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTemplateData) => {
      // SECURITY: Verify ownership with user_id filter
      const { data, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar template', { description: error.message });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // SECURITY: Verify ownership with user_id filter
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover template', { description: error.message });
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (id: string) => {
      // SECURITY: Use fresh DB read instead of stale cache to prevent race conditions
      const { data: current, error: fetchError } = await supabase
        .from('email_templates')
        .select('usage_count')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();
      if (fetchError) throw fetchError;
      if (current) {
        const { error } = await supabase
          .from('email_templates')
          .update({ usage_count: (current.usage_count || 0) + 1 })
          .eq('id', id)
          .eq('user_id', user!.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  };
}
