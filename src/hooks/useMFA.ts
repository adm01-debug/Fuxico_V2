import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MFASettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  enrolled_at: string | null;
  last_verified_at: string | null;
  recovery_email: string | null;
  backup_codes: string[] | null;
}

export interface MFAEnrollmentData {
  qr_code: string;
  secret: string;
  factor_id: string;
}

export function useMFA() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollmentData | null>(null);

  // Fetch MFA settings
  const { data: mfaSettings, isLoading } = useQuery({
    queryKey: ['mfaSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as MFASettings | null;
    },
    enabled: !!user?.id,
  });

  // Check if MFA is required for verification
  const { data: mfaFactors } = useQuery({
    queryKey: ['mfaFactors'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Enroll MFA (TOTP)
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data.totp) {
        setEnrollmentData({
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          factor_id: data.id,
        });
      }

      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao iniciar MFA');
    },
  });

  // Verify and activate MFA
  const verifyMutation = useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      // Create challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // Save to our table
      await supabase.from('mfa_settings').upsert({
        user_id: user?.id,
        is_enabled: true,
        enrolled_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        backup_codes: backupCodes,
      });

      return { backupCodes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      queryClient.invalidateQueries({ queryKey: ['mfaFactors'] });
      toast.success('MFA ativado com sucesso!');
      setEnrollmentData(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Código inválido');
    },
  });

  // Disable MFA
  const disableMutation = useMutation({
    mutationFn: async () => {
      const factors = mfaFactors?.totp || [];
      
      for (const factor of factors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      await supabase.from('mfa_settings').upsert({
        user_id: user?.id,
        is_enabled: false,
        enrolled_at: null,
        backup_codes: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      queryClient.invalidateQueries({ queryKey: ['mfaFactors'] });
      toast.success('MFA desativado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao desativar MFA');
    },
  });

  // Verify with backup code
  const verifyBackupMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error('Usuário não encontrado');

      const { data, error } = await supabase
        .from('mfa_settings')
        .select('backup_codes')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const backupCodes = data?.backup_codes || [];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());

      if (codeIndex === -1) {
        throw new Error('Código de backup inválido');
      }

      // Remove used code
      const newCodes = [...backupCodes];
      newCodes.splice(codeIndex, 1);

      await supabase.from('mfa_settings').update({
        backup_codes: newCodes,
        last_verified_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      return { remainingCodes: newCodes.length };
    },
    onSuccess: ({ remainingCodes }) => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      if (remainingCodes <= 2) {
        toast.warning('Você tem poucos códigos de backup restantes');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isEnabled = mfaSettings?.is_enabled || false;
  const hasTOTP = (mfaFactors?.totp?.length || 0) > 0;

  return {
    mfaSettings,
    isLoading,
    isEnabled,
    hasTOTP,
    enrollmentData,
    enroll: enrollMutation.mutate,
    verify: verifyMutation.mutate,
    disable: disableMutation.mutate,
    verifyBackup: verifyBackupMutation.mutate,
    isEnrolling: enrollMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
}
