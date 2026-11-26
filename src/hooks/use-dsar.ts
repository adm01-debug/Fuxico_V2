/**
 * Hook de direitos do titular (LGPD Art. 18/19) — exportação de dados pessoais.
 * Consome a edge function `dsar-export` e a tabela `dsar_requests`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DsarRequest {
  id: string;
  request_type: string;
  status: string;
  export_path: string | null;
  download_expires_at: string | null;
  requested_at: string;
  completed_at: string | null;
  deadline_at: string;
  created_at: string;
}

export interface DsarExportResult {
  dsar_id: string;
  mode: 'inline' | 'storage';
  data?: Record<string, unknown>;
  download_url?: string;
  expires_at?: string;
  size_bytes?: number;
  checksum?: string;
  refreshed?: boolean;
}

type DsarPayloads =
  { mode: 'inline'; result: DsarExportResult } | { mode: 'storage'; result: DsarExportResult };

async function invokeDsarExport(body: Record<string, unknown> = {}): Promise<DsarExportResult> {
  const { data, error } = await supabase.functions.invoke('dsar-export', { body });

  if (error) {
    // O corpo de erro da function traz { error: 'codigo' }; preserva o motivo real.
    const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (ctx?.json) {
      const parsed = await ctx.json().catch(() => null);
      if (parsed?.error) throw new Error(parsed.error);
    }
    throw error;
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error));
  }

  return data as DsarExportResult;
}

export function useDsarRequests() {
  return useQuery<DsarRequest[]>({
    queryKey: ['dsar-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dsar_requests')
        .select(
          'id, request_type, status, export_path, download_expires_at, requested_at, completed_at, deadline_at, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as DsarRequest[];
    },
  });
}

/** Solicita uma nova exportação (JSON inline quando <= 2MB, senão link assinado de 24h). */
export function useRequestDsarExport() {
  const queryClient = useQueryClient();

  return useMutation<DsarPayloads, Error>({
    mutationFn: async () => {
      const result = await invokeDsarExport();
      return { mode: result.mode, result } as DsarPayloads;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsar-requests'] });
    },
  });
}

/** Reemite o link assinado de uma exportação existente (válido por 24h/30 dias do pedido). */
export function useRefreshDsarExport() {
  const queryClient = useQueryClient();

  return useMutation<DsarExportResult, Error, string>({
    mutationFn: (dsarId: string) => invokeDsarExport({ action: 'refresh', dsar_id: dsarId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dsar-requests'] });
    },
  });
}

/** Dispara o download do export: Blob para dados inline, nova aba para link assinado. */
export function downloadDsarExport(result: DsarExportResult) {
  if (result.mode === 'inline' && result.data) {
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus-dados-${result.dsar_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  if (result.download_url) window.open(result.download_url, '_blank', 'noopener,noreferrer');
}

export function isDsarLinkExpired(request: DsarRequest): boolean {
  if (request.status !== 'completed' || !request.download_expires_at) return false;
  if (request.export_path?.startsWith('inline:')) return false;
  return new Date(request.download_expires_at).getTime() < Date.now();
}

/**
 * Linha de status exibida no histórico.
 * Export inline não tem link para reabrir — o JSON veio no corpo da solicitação.
 */
export function describeDsarRequest(request: DsarRequest): string | null {
  if (request.status !== 'completed') return null;
  if (request.export_path?.startsWith('inline:')) return 'Baixado automaticamente ao solicitar.';
  if (isDsarLinkExpired(request)) return 'Link expirado — gere um novo.';
  if (request.download_expires_at) {
    return `Link válido até ${new Date(request.download_expires_at).toLocaleString('pt-BR')}`;
  }
  return null;
}

export const DSAR_STATUS_LABELS: Record<string, string> = {
  pending: 'Na fila',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
};
