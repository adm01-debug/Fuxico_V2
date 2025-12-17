import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  bitrix24, 
  Bitrix24Config, 
  Bitrix24Contact, 
  Bitrix24Activity, 
  Bitrix24Deal 
} from '@/lib/bitrix24';

export function useBitrix24Config() {
  const [config, setConfig] = useState<Bitrix24Config>(bitrix24.getConfig());

  const updateConfig = useCallback((updates: Partial<Bitrix24Config>) => {
    bitrix24.updateConfig(updates);
    setConfig(bitrix24.getConfig());
  }, []);

  return { config, updateConfig };
}

export function useBitrix24Contacts() {
  return useQuery<Bitrix24Contact[]>({
    queryKey: ['bitrix24', 'contacts'],
    queryFn: () => bitrix24.getContacts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBitrix24Activities() {
  return useQuery<Bitrix24Activity[]>({
    queryKey: ['bitrix24', 'activities'],
    queryFn: () => bitrix24.getActivities(),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useBitrix24Deals() {
  return useQuery<Bitrix24Deal[]>({
    queryKey: ['bitrix24', 'deals'],
    queryFn: () => bitrix24.getDeals(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSyncContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, name }: { email: string; name?: string }) =>
      bitrix24.syncContact(email, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'contacts'] });
    },
  });
}

export function useRegisterActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      subject,
      contactEmail,
      metadata,
    }: {
      type: Bitrix24Activity['type'];
      subject: string;
      contactEmail: string;
      metadata?: Record<string, unknown>;
    }) => bitrix24.registerActivity(type, subject, contactEmail, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'activities'] });
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      contactEmail,
      value,
    }: {
      title: string;
      contactEmail: string;
      value?: number;
    }) => bitrix24.createDeal(title, contactEmail, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitrix24', 'deals'] });
    },
  });
}
