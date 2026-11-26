import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export type SignatureRequestStatus =
  'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export type SignatureSignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';

export interface SignatureSigner {
  id: string;
  request_id: string;
  email: string;
  name: string | null;
  order: number;
  status: SignatureSignerStatus;
  signed_at: string | null;
  token: string;
}

export interface SignatureRequest {
  id: string;
  document_id: string;
  documentName: string;
  status: SignatureRequestStatus;
  message: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  signers: SignatureSigner[];
}

export interface CreatedSignerLink {
  email: string;
  name: string | null;
  order: number;
  status: string;
  token: string | null;
  signUrl: string | null;
}

export interface CreateSignatureRequestInput {
  documentId: string;
  signers: Array<{ email: string; name: string; order: number }>;
  message?: string;
  expiresAt?: string;
}

export const SIGNATURE_STATUS_LABELS: Record<SignatureRequestStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

export const SIGNER_STATUS_LABELS: Record<SignatureSignerStatus, string> = {
  pending: 'Pendente',
  viewed: 'Visualizou',
  signed: 'Assinou',
  declined: 'Recusou',
};

export function buildSignUrl(token: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return origin + '/sign/' + token;
}

export function useSignatureRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['signature-requests', user?.id],
    queryFn: async (): Promise<SignatureRequest[]> => {
      if (!user) return [];

      const { data: requests, error } = await supabase
        .from('signature_requests')
        .select('id, document_id, status, message, expires_at, completed_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!requests?.length) return [];

      const requestIds = requests.map((request) => request.id);
      const documentIds = [...new Set(requests.map((request) => request.document_id))];

      const [signersResult, documentsResult] = await Promise.all([
        supabase
          .from('signature_signers')
          .select('id, request_id, email, name, order, status, signed_at, token')
          .in('request_id', requestIds),
        supabase.from('tracked_documents').select('id, file_name').in('id', documentIds),
      ]);

      if (signersResult.error) throw signersResult.error;

      const documentsById = new Map(
        (documentsResult.data ?? []).map((document) => [document.id, document.file_name])
      );
      const signersByRequest = new Map<string, SignatureSigner[]>();

      (signersResult.data ?? []).forEach((signer) => {
        const list = signersByRequest.get(signer.request_id) ?? [];
        list.push(signer as SignatureSigner);
        signersByRequest.set(signer.request_id, list);
      });

      return requests.map((request) => ({
        id: request.id,
        document_id: request.document_id,
        documentName: documentsById.get(request.document_id) ?? 'Documento',
        status: request.status as SignatureRequestStatus,
        message: request.message,
        expires_at: request.expires_at,
        completed_at: request.completed_at,
        created_at: request.created_at,
        signers: (signersByRequest.get(request.id) ?? []).sort((a, b) => a.order - b.order),
      }));
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useCreateSignatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSignatureRequestInput): Promise<CreatedSignerLink[]> => {
      const { data, error } = await supabase.functions.invoke('send-signature-request', {
        body: {
          documentId: input.documentId,
          signers: input.signers,
          ...(input.message ? { message: input.message } : {}),
          ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
        },
      });

      if (error) {
        const status = (error as { context?: { status?: number } }).context?.status;
        throw new Error(
          status === 401
            ? 'Sessão expirada. Entre novamente para solicitar a assinatura.'
            : 'Não foi possível criar a solicitação de assinatura.'
        );
      }

      const payload = data as { success?: boolean; signers?: CreatedSignerLink[] } | null;
      if (!payload?.success) throw new Error('A solicitação não foi confirmada pelo servidor.');

      return payload.signers ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
    },
  });
}

export function useCancelSignatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('signature_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-requests'] });
    },
  });
}
