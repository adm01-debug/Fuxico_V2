// FUXICO - Hook: useDuplicate
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseDuplicateOptions<T> {
  table: string;
  queryKey: string[];
  excludeFields?: string[];
  transformData?: (data: T) => Partial<T>;
}

export function useDuplicate<T extends Record<string, unknown>>({
  table,
  queryKey,
  excludeFields = ['id', 'created_at', 'updated_at', 'deleted_at'],
  transformData,
}: UseDuplicateOptions<T>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sourceId: string) => {
      // Buscar registro original
      const { data: original, error: fetchError } = await supabase
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
        newData = { ...newData, ...transformData(original as T) };
      }

      // Adicionar sufixo ao nome/titulo se existir
      if (newData.name) newData.name = `${newData.name} (copia)`;
      if (newData.title) newData.title = `${newData.title} (copia)`;
      if (newData.subject) newData.subject = `${newData.subject} (copia)`;

      // Inserir novo registro
      const { data: duplicated, error: insertError } = await supabase
        .from(table)
        .insert(newData)
        .select()
        .single();

      if (insertError) throw insertError;
      return duplicated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro duplicado com sucesso');
      return data;
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
