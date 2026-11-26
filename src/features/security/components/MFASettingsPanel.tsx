import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Smartphone,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useMfaBackupCodes } from '@/hooks/use-mfa-backup-codes';

export function MFASettingsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { remaining, generate } = useMfaBackupCodes();
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const generatedCodes = generate.data ?? [];
  const remainingLabel = `${remaining} ${remaining === 1 ? 'código disponível' : 'códigos disponíveis'}`;

  const { data: mfaSettings, isLoading } = useQuery({
    queryKey: ['mfaSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('id, is_enabled, enrolled_at, last_verified_at, recovery_email')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const regenerateBackupCodes = () =>
    generate.mutate(undefined, {
      onError: () => toast.error('Erro ao gerar códigos de backup'),
    });

  const startEnrollment = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Fuxico',
      });
      if (error) throw error;
      if (!data.totp) throw new Error('Não foi possível iniciar a configuração do MFA');
      return data.totp;
    },
    onSuccess: (totp) => {
      setQrCode(totp.qr_code);
      setSecret(totp.secret);
      setVerifyCode('');
      setShowEnrollDialog(true);
    },
    onError: () => {
      toast.error('Erro ao iniciar a configuração do MFA');
    },
  });

  const confirmEnrollment = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) throw new Error('Fator TOTP não encontrado');

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      const { error: upsertError } = await supabase.from('mfa_settings').upsert({
        user_id: user.id,
        is_enabled: true,
        enrolled_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        recovery_email: user.email ?? '',
      });
      if (upsertError) throw upsertError;

      await supabase.functions.invoke('log-security-event', {
        body: {
          event_type: 'mfa_enabled',
          severity: 'info',
          description: 'MFA foi ativado na conta',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      setShowEnrollDialog(false);
      setQrCode('');
      setSecret('');
      setVerifyCode('');
      regenerateBackupCodes();
      toast.success('MFA ativado com sucesso! Guarde seus códigos de backup.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Código inválido');
    },
  });

  const disableMFA = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id,
        });
        if (unenrollError) throw unenrollError;
      }

      const { error } = await supabase
        .from('mfa_settings')
        .update({
          is_enabled: false,
          totp_secret: null,
          backup_codes: null,
          enrolled_at: null,
        })
        .eq('user_id', user.id);
      if (error) throw error;

      await supabase.functions.invoke('log-security-event', {
        body: {
          event_type: 'mfa_disabled',
          severity: 'warning',
          description: 'MFA foi desativado na conta',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      setShowDisableDialog(false);
      toast.success('MFA desativado');
    },
    onError: () => {
      toast.error('Erro ao desativar MFA');
    },
  });

  const copyBackupCodes = () => {
    if (generatedCodes.length > 0) {
      navigator.clipboard.writeText(generatedCodes.join('\n'));
      toast.success('Códigos copiados para a área de transferência');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Key className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">Autenticação em Duas Etapas</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Adicione uma camada extra de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div
                className={`shrink-0 rounded-full p-1.5 sm:p-2 ${mfaSettings?.is_enabled ? 'bg-green-500/10' : 'bg-muted'}`}
              >
                {mfaSettings?.is_enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium sm:text-base">Status do MFA</p>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {mfaSettings?.is_enabled ? 'Proteção ativa' : 'Não configurado'}
                </p>
              </div>
            </div>
            <Badge
              variant={mfaSettings?.is_enabled ? 'default' : 'secondary'}
              className="shrink-0 text-xs"
            >
              {mfaSettings?.is_enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {mfaSettings?.is_enabled ? (
            <div className="space-y-3">
              <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
                <p className="truncate">
                  Ativado em:{' '}
                  {mfaSettings.enrolled_at &&
                    format(new Date(mfaSettings.enrolled_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                {mfaSettings.last_verified_at && (
                  <p className="truncate">
                    Última verificação:{' '}
                    {format(new Date(mfaSettings.last_verified_at), "dd/MM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>

              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="h-11 w-full">
                    <XCircle className="mr-2 h-4 w-4" />
                    Desativar MFA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                      Desativar MFA?
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Isso irá remover a proteção de autenticação em duas etapas da sua conta. Sua
                      conta ficará menos segura.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setShowDisableDialog(false)}
                      className="h-11 w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => disableMFA.mutate()}
                      disabled={disableMFA.isPending}
                      className="h-11 w-full sm:w-auto"
                    >
                      Desativar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              <Button
                className="h-11 w-full"
                onClick={() => startEnrollment.mutate()}
                disabled={startEnrollment.isPending}
              >
                {startEnrollment.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Ativar MFA
              </Button>

              <Dialog
                open={showEnrollDialog}
                onOpenChange={(open) => {
                  setShowEnrollDialog(open);
                  if (!open) setVerifyCode('');
                }}
              >
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Configurar App Autenticador</DialogTitle>
                    <DialogDescription className="text-sm">
                      Escaneie o QR code e digite o código de 6 dígitos para ativar a proteção.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {qrCode && (
                      <div className="flex justify-center">
                        <img
                          src={qrCode}
                          alt="QR Code para configurar o app autenticador"
                          className="h-40 w-40 rounded-lg border"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Ou digite o código manualmente:</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 break-all rounded bg-muted p-2 font-mono text-xs">
                          {secret}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Copiar código secreto"
                          onClick={() => {
                            navigator.clipboard.writeText(secret);
                            toast.success('Código copiado!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Código de 6 dígitos do app:</Label>
                      <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
                        <InputOTPGroup className="justify-center">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setShowEnrollDialog(false)}
                      className="h-11 w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => confirmEnrollment.mutate()}
                      disabled={confirmEnrollment.isPending || verifyCode.length !== 6}
                      className="h-11 w-full sm:w-auto"
                    >
                      {confirmEnrollment.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Verificar e Ativar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            Códigos de Backup
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use se perder acesso ao dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          {mfaSettings?.is_enabled ? (
            <>
              <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                {generatedCodes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {generatedCodes.map((code) => (
                      <code
                        key={code}
                        className="truncate rounded bg-background p-1 text-center font-mono text-[10px] sm:p-1.5 sm:text-sm"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center sm:py-4">
                    <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
                      {generate.isPending ? 'Gerando códigos...' : remainingLabel}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateBackupCodes}
                      disabled={generate.isPending}
                      className="h-10"
                    >
                      {generate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                      )}
                      Gerar novos códigos
                    </Button>
                  </div>
                )}
              </div>

              {generatedCodes.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="h-10 flex-1" onClick={copyBackupCodes}>
                    <Copy className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={regenerateBackupCodes}
                    disabled={generate.isPending}
                  >
                    <RefreshCw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Regenerar</span>
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground sm:text-xs">
                ⚠️ Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez e é
                exibido apenas no momento em que é gerado.
              </p>
            </>
          ) : (
            <div className="py-4 text-center text-muted-foreground sm:py-6">
              <Key className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
              <p className="text-xs sm:text-sm">Ative o MFA para gerar códigos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            Métodos de Verificação
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure como receber códigos de verificação
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium sm:text-base">App Autenticador</p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Google Authenticator, Authy
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px] sm:text-xs">
                Recomendado
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium sm:text-base">Email de Recuperação</p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {mfaSettings?.recovery_email || user?.email || 'Não configurado'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                Configurado
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
