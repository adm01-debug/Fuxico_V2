/** Hook para duplicação de entidades */
// FUXICO - Hook: useDuplicate
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseDuplicateOptions {
  table: string;
  queryKey: string[];
  excludeFields?: string[];
  transformData?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export function useDuplicate({
  table,
  queryKey,
  excludeFields = ['id', 'created_at', 'updated_at'],
  transformData,
}: UseDuplicateOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sourceId: string) => {
      // Buscar registro original
      const { data: original, error: fetchError } = await (supabase as any)
        .from(table)
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Registro nao encontrado');

      // Preparar dados para duplicacao
      let newData = { ...original } as Record<string, unknown>;
      
      // Remover campos excluidos
      excludeFields.forEach(field => {
        delete newData[field];
      });

      // Aplicar transformacao customizada
      if (transformData) {
        newData = { ...newData, ...transformData(original) };
      }

      // Adicionar sufixo ao nome/titulo se existir
      if (newData.name) newData.name = `${newData.name} (copia)`;
      if (newData.title) newData.title = `${newData.title} (copia)`;
      if (newData.subject) newData.subject = `${newData.subject} (copia)`;

      // Inserir novo registro
      const { data: duplicated, error: insertError } = await (supabase as any)
        .from(table)
        .insert(newData)
        .select()
        .single();

      if (insertError) throw insertError;
      return duplicated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro duplicado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao duplicar: ${error.message}`);
    },
  });

  return {
    duplicate: mutation.mutate,
    duplicateAsync: mutation.mutateAsync,
    isDuplicating: mutation.isPending,
    error: mutation.error,
  };
}

export default useDuplicate;
