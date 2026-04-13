import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Smartphone, Mail, Shield, CheckCircle2, XCircle, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function MFASettingsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const { data: mfaSettings, isLoading } = useQuery({
    queryKey: ['mfaSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const enableMFA = useMutation({
    mutationFn: async () => {
      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const { error } = await supabase
        .from('mfa_settings')
        .upsert({
          ...(user?.id ? { user_id: user.id } : {}),
          is_enabled: true,
          enrolled_at: new Date().toISOString(),
          backup_codes: backupCodes,
          recovery_email: user?.email ?? '',
        } as Record<string, unknown>);
      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: user?.id ?? null,
        _event_type: 'mfa_enabled',
        _severity: 'info',
        _description: 'MFA foi ativado na conta',
      });

      return backupCodes;
    },
    onSuccess: (_backupCodes) => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      toast.success('MFA ativado com sucesso! Guarde seus códigos de backup.');
      setShowBackupCodes(true);
    },
    onError: () => {
      toast.error('Erro ao ativar MFA');
    },
  });

  const disableMFA = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('mfa_settings')
        .update({
          is_enabled: false,
          totp_secret: null,
          backup_codes: null,
        })
        .eq('user_id', user?.id);
      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: user?.id,
        _event_type: 'mfa_disabled',
        _severity: 'warning',
        _description: 'MFA foi desativado na conta',
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

  const regenerateBackupCodes = useMutation({
    mutationFn: async () => {
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      const { error } = await supabase
        .from('mfa_settings')
        .update({ backup_codes: backupCodes })
        .eq('user_id', user?.id);
      if (error) throw error;

      await supabase.rpc('log_security_event', {
        _user_id: user?.id,
        _event_type: 'backup_codes_regenerated',
        _severity: 'info',
        _description: 'Códigos de backup foram regenerados',
      });

      return backupCodes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfaSettings'] });
      toast.success('Novos códigos de backup gerados');
    },
    onError: () => {
      toast.error('Erro ao regenerar códigos');
    },
  });

  const copyBackupCodes = () => {
    if (mfaSettings?.backup_codes) {
      navigator.clipboard.writeText(mfaSettings.backup_codes.join('\n'));
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
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Key className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Autenticação em Duas Etapas</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Adicione uma camada extra de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${mfaSettings?.is_enabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                {mfaSettings?.is_enabled ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base">Status do MFA</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {mfaSettings?.is_enabled ? 'Proteção ativa' : 'Não configurado'}
                </p>
              </div>
            </div>
            <Badge variant={mfaSettings?.is_enabled ? 'default' : 'secondary'} className="shrink-0 text-xs">
              {mfaSettings?.is_enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {mfaSettings?.is_enabled ? (
            <div className="space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="truncate">Ativado em: {mfaSettings.enrolled_at && format(new Date(mfaSettings.enrolled_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                {mfaSettings.last_verified_at && (
                  <p className="truncate">Última verificação: {format(new Date(mfaSettings.last_verified_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                )}
              </div>

              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-11">
                    <XCircle className="h-4 w-4 mr-2" />
                    Desativar MFA
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      Desativar MFA?
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      Isso irá remover a proteção de autenticação em duas etapas da sua conta. Sua conta ficará menos segura.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setShowDisableDialog(false)} className="w-full sm:w-auto h-11">
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => disableMFA.mutate()}
                      disabled={disableMFA.isPending}
                      className="w-full sm:w-auto h-11"
                    >
                      Desativar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Button 
              className="w-full h-11" 
              onClick={() => enableMFA.mutate()}
              disabled={enableMFA.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Ativar MFA
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Códigos de Backup
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use se perder acesso ao dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          {mfaSettings?.is_enabled && mfaSettings?.backup_codes ? (
            <>
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/50">
                {showBackupCodes ? (
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {mfaSettings.backup_codes.map((code: string, index: number) => (
                      <code key={index} className="text-[10px] sm:text-sm font-mono bg-background p-1 sm:p-1.5 rounded text-center truncate">
                        {code}
                      </code>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 sm:py-4">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      {mfaSettings.backup_codes.length} códigos disponíveis
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(true)} className="h-10">
                      Mostrar códigos
                    </Button>
                  </div>
                )}
              </div>

              {showBackupCodes && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1 h-10" onClick={copyBackupCodes}>
                    <Copy className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10"
                    onClick={() => regenerateBackupCodes.mutate()}
                    disabled={regenerateBackupCodes.isPending}
                  >
                    <RefreshCw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Regenerar</span>
                  </Button>
                </div>
              )}

              <p className="text-[10px] sm:text-xs text-muted-foreground">
                ⚠️ Guarde estes códigos em local seguro. Cada código só pode ser usado uma vez.
              </p>
            </>
          ) : (
            <div className="text-center py-4 sm:py-6 text-muted-foreground">
              <Key className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Ative o MFA para gerar códigos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Métodos de Verificação
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure como receber códigos de verificação
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">App Autenticador</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Google Authenticator, Authy
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">Recomendado</Badge>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Email de Recuperação</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {mfaSettings?.recovery_email || user?.email || 'Não configurado'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">Configurado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
