/**
 * Hook para configurações de auditoria
 * 
 * @description Este hook fornece funcionalidades para hook para configurações de auditoria.
 * Inclui gerenciamento de estado, cache e tratamento de erros.
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useauditconfig();
 * ```
 * 
 * @returns Object contendo data, isLoading, error e funções auxiliares
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditConfig {
  id: string;
  internal_domains: string[];
  business_hours_start: number;
  business_hours_end: number;
  timezone: string;
  volume_threshold_hourly: number;
  volume_threshold_daily: number;
  updated_at: string;
}

export function useAuditConfig() {
  return useQuery({
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    queryKey: ["audit-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_config")
        .select("*")
        .single();

      if (error) throw error;
      return data as AuditConfig;
    },
  });
}

export function useUpdateAuditConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<AuditConfig> & { id: string }) => {
      const { id, ...updates } = config;
      const { data, error } = await supabase
        .from("audit_config")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-config"] });
    },
  });
}
