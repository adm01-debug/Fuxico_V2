import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Loader2, ArrowLeft, KeyRound, Copy, CheckCircle } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface MFASettings {
  is_enabled: boolean;
  enrolled_at: string | null;
  last_verified_at: string | null;
  backup_codes: string[] | null;
}

export default function TwoFactorAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mfaSettings, setMfaSettings] = useState<MFASettings | null>(null);
  const [step, setStep] = useState<'overview' | 'enroll' | 'verify' | 'backup'>('overview');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadMFASettings();
  }, [user, navigate]);

  const loadMFASettings = async () => {
    try {
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setMfaSettings(data);
    } catch (err) {
      console.error('Error loading MFA settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setLoading(true);
    try {
      // Use Supabase MFA enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('enroll');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar configuração MFA';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (verifyCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setVerifying(true);
    try {
      // Get the challenge
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) throw new Error('Fator TOTP não encontrado');

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Generate backup codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);

      // Save MFA settings to our table
      await supabase.from('mfa_settings').upsert({
        user_id: user?.id,
        is_enabled: true,
        enrolled_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        backup_codes: codes,
      });

      toast.success('MFA ativado com sucesso!');
      setStep('backup');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Código inválido';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const disableMFA = async () => {
    if (!confirm('Tem certeza que deseja desativar a autenticação de dois fatores?')) {
      return;
    }

    setLoading(true);
    try {
      // Unenroll from Supabase MFA
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (totpFactor) {
        await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      }

      // Update our settings
      await supabase.from('mfa_settings').upsert({
        user_id: user?.id,
        is_enabled: false,
        totp_secret: null,
        backup_codes: null,
        enrolled_at: null,
      });

      setMfaSettings(null);
      toast.success('MFA desativado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desativar MFA';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Códigos copiados!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => step === 'overview' ? navigate(-1) : setStep('overview')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {step === 'overview' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Autenticação de Dois Fatores</CardTitle>
                  <CardDescription>
                    Adicione uma camada extra de segurança à sua conta
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">App Autenticador</p>
                      <p className="text-sm text-muted-foreground">
                        {mfaSettings?.is_enabled 
                          ? `Ativado em ${new Date(mfaSettings.enrolled_at!).toLocaleDateString()}`
                          : 'Use Google Authenticator, Authy ou similar'
                        }
                      </p>
                    </div>
                  </div>
                  {mfaSettings?.is_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : null}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {mfaSettings?.is_enabled ? (
                <Button variant="destructive" className="w-full" onClick={disableMFA}>
                  Desativar MFA
                </Button>
              ) : (
                <Button className="w-full" onClick={startEnrollment}>
                  Configurar MFA
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {step === 'enroll' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar App Autenticador</CardTitle>
              <CardDescription>
                Escaneie o QR code com seu app autenticador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                {qrCode && (
                  <img 
                    src={qrCode} 
                    alt="QR Code MFA" 
                    className="w-48 h-48 rounded-lg border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Ou digite o código manualmente:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success('Código copiado!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Digite o código de 6 dígitos do app:</Label>
                <InputOTP 
                  maxLength={6} 
                  value={verifyCode} 
                  onChange={setVerifyCode}
                >
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
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={verifyAndActivate}
                disabled={verifying || verifyCode.length !== 6}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar e Ativar'
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'backup' && (
          <Card>
            <CardHeader>
              <CardTitle>Códigos de Backup</CardTitle>
              <CardDescription>
                Salve esses códigos em um local seguro. Você pode usá-los para acessar sua conta caso perca acesso ao app autenticador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded font-mono text-sm cursor-pointer hover:bg-muted/80"
                    onClick={() => copyCode(code, index)}
                  >
                    <span>{code}</span>
                    {copiedIndex === index ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={copyAllCodes}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Todos os Códigos
              </Button>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  <strong>Importante:</strong> Cada código só pode ser usado uma vez. 
                  Guarde-os em um local seguro e não compartilhe com ninguém.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/')}>
                Concluir Configuração
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
