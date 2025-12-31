import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Key, Smartphone, Mail, Shield, CheckCircle2, XCircle, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
          user_id: user?.id,
          is_enabled: true,
          enrolled_at: new Date().toISOString(),
          backup_codes: backupCodes,
          recovery_email: user?.email,
        });
      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        _user_id: user?.id,
        _event_type: 'mfa_enabled',
        _severity: 'info',
        _description: 'MFA foi ativado na conta',
      });

      return backupCodes;
    },
    onSuccess: (backupCodes) => {
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
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Autenticação em Duas Etapas
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${mfaSettings?.is_enabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                {mfaSettings?.is_enabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">Status do MFA</p>
                <p className="text-sm text-muted-foreground">
                  {mfaSettings?.is_enabled ? 'Proteção ativa' : 'Não configurado'}
                </p>
              </div>
            </div>
            <Badge variant={mfaSettings?.is_enabled ? 'default' : 'secondary'}>
              {mfaSettings?.is_enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {mfaSettings?.is_enabled ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>Ativado em: {mfaSettings.enrolled_at && format(new Date(mfaSettings.enrolled_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                {mfaSettings.last_verified_at && (
                  <p>Última verificação: {format(new Date(mfaSettings.last_verified_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                )}
              </div>

              <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    Desativar MFA
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Desativar MFA?
                    </DialogTitle>
                    <DialogDescription>
                      Isso irá remover a proteção de autenticação em duas etapas da sua conta. Sua conta ficará menos segura.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => disableMFA.mutate()}
                      disabled={disableMFA.isPending}
                    >
                      Desativar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <Button 
              className="w-full" 
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Códigos de Backup
          </CardTitle>
          <CardDescription>
            Use estes códigos se perder acesso ao seu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaSettings?.is_enabled && mfaSettings?.backup_codes ? (
            <>
              <div className="p-4 rounded-lg border bg-muted/50">
                {showBackupCodes ? (
                  <div className="grid grid-cols-2 gap-2">
                    {mfaSettings.backup_codes.map((code: string, index: number) => (
                      <code key={index} className="text-sm font-mono bg-background p-1 rounded text-center">
                        {code}
                      </code>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {mfaSettings.backup_codes.length} códigos disponíveis
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(true)}>
                      Mostrar códigos
                    </Button>
                  </div>
                )}
              </div>

              {showBackupCodes && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={copyBackupCodes}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => regenerateBackupCodes.mutate()}
                    disabled={regenerateBackupCodes.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                ⚠️ Guarde estes códigos em um local seguro. Cada código só pode ser usado uma vez.
              </p>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ative o MFA para gerar códigos de backup</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Métodos de Verificação
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber os códigos de verificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">App Autenticador (TOTP)</p>
                  <p className="text-sm text-muted-foreground">
                    Use Google Authenticator, Authy ou similar
                  </p>
                </div>
              </div>
              <Badge variant="outline">Recomendado</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email de Recuperação</p>
                  <p className="text-sm text-muted-foreground">
                    {mfaSettings?.recovery_email || user?.email || 'Não configurado'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Configurado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
