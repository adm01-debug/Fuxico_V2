// =============================================================================
// FUXICO - Dominios Proprios Hook
// Backend: edge function verify-custom-domain (register / verify / remove)
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CUSTOM_DOMAIN_COLUMNS =
  'id, domain, verification_type, verification_token, status, verified, ssl_enabled, created_at, updated_at';

export const CUSTOM_DOMAINS_QUERY_KEY = ['custom-domains'] as const;

export type DomainVerificationType = 'dns' | 'file' | 'meta';
export type DomainStatus = 'pending' | 'verified' | 'failed';

export interface CustomDomain {
  id: string;
  domain: string;
  verification_type: DomainVerificationType;
  verification_token: string | null;
  status: DomainStatus;
  verified: boolean;
  ssl_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type DomainInstructions =
  | { type: 'dns'; recordName: string; recordType: string; recordValue: string }
  | { type: 'file'; fileUrl: string; fileContent: string }
  | { type: 'meta'; metaTag: string };

export interface RegisterDomainResult {
  success: boolean;
  domain: string;
  verificationType: DomainVerificationType;
  token: string;
  instructions: DomainInstructions;
}

export interface VerifyDomainResult {
  success: boolean;
  domain: string;
  verified: boolean;
  status: DomainStatus;
  message: string;
  checkedAt: string;
}

export const DOMAIN_VERIFICATION_LABELS: Record<DomainVerificationType, string> = {
  dns: 'Registro DNS (TXT)',
  file: 'Arquivo no servidor',
  meta: 'Meta tag no HTML',
};

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  pending: 'Aguardando verificacao',
  verified: 'Verificado',
  failed: 'Verificacao falhou',
};

const DOMAIN_PATTERN = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function isValidDomain(domain: string): boolean {
  return DOMAIN_PATTERN.test(domain.trim());
}

export function dnsRecordName(domain: string): string {
  return `_fuxico.${domain}`;
}

/**
 * Instrucoes derivadas da linha salva, para reexibir o passo a passo depois
 * que a resposta da edge function ja nao esta mais em memoria.
 */
export function buildInstructions(
  verificationType: DomainVerificationType,
  domain: string,
  token: string
): DomainInstructions {
  if (verificationType === 'file') {
    return { type: 'file', fileUrl: `https://${domain}/${token}.txt`, fileContent: token };
  }
  if (verificationType === 'meta') {
    return {
      type: 'meta',
      metaTag: `<meta name="fuxico-site-verification" content="${token}" />`,
    };
  }
  return { type: 'dns', recordName: dnsRecordName(domain), recordType: 'TXT', recordValue: token };
}

async function invokeDomainAction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('verify-custom-domain', { body });
  if (error) throw error;
  return data as T;
}

export function useCustomDomain() {
  return useQuery<CustomDomain | null>({
    queryKey: CUSTOM_DOMAINS_QUERY_KEY,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('custom_domains')
        .select(CUSTOM_DOMAIN_COLUMNS)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as CustomDomain | null) ?? null;
    },
  });
}

export function useRegisterCustomDomain() {
  const queryClient = useQueryClient();

  return useMutation<
    RegisterDomainResult,
    Error,
    { domain: string; verificationType: DomainVerificationType }
  >({
    mutationFn: (input) =>
      invokeDomainAction<RegisterDomainResult>({
        action: 'register',
        domain: input.domain.trim().toLowerCase(),
        verificationType: input.verificationType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_DOMAINS_QUERY_KEY });
    },
  });
}

export function useVerifyCustomDomain() {
  const queryClient = useQueryClient();

  return useMutation<
    VerifyDomainResult,
    Error,
    { domain: string; verificationType: DomainVerificationType }
  >({
    mutationFn: (input) =>
      invokeDomainAction<VerifyDomainResult>({
        action: 'verify',
        domain: input.domain,
        verificationType: input.verificationType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_DOMAINS_QUERY_KEY });
    },
  });
}

export function useRemoveCustomDomain() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; removed: boolean }, Error, void>({
    mutationFn: () =>
      invokeDomainAction<{ success: boolean; removed: boolean }>({ action: 'remove' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_DOMAINS_QUERY_KEY });
    },
  });
}
