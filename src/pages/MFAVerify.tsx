import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function MFAVerify() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || '/';

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      // Get the TOTP factor
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      const totpFactor = factors?.totp?.[0];
      
      if (!totpFactor) {
        toast.error('MFA não configurado');
        navigate('/login');
        return;
      }

      // Create a challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: code,
      });

      if (verifyError) throw verifyError;

      // Update last verified timestamp
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mfa_settings').update({
          last_verified_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }

      toast.success('Verificação bem-sucedida!');
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeVerify = async () => {
    if (code.length < 6) {
      toast.error('Digite o código de backup');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Get backup codes
      const { data: mfaData, error } = await supabase
        .from('mfa_settings')
        .select('backup_codes')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const backupCodes = mfaData?.backup_codes || [];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());

      if (codeIndex === -1) {
        toast.error('Código de backup inválido');
        return;
      }

      // Remove used backup code
      const newCodes = [...backupCodes];
      newCodes.splice(codeIndex, 1);

      await supabase.from('mfa_settings').update({
        backup_codes: newCodes,
        last_verified_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      toast.success('Verificação bem-sucedida!');
      
      if (newCodes.length <= 2) {
        toast.warning('Você tem poucos códigos de backup restantes. Considere gerar novos.');
      }

      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err.message || 'Erro na verificação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Verificação de Dois Fatores</CardTitle>
          <CardDescription>
            {useBackupCode 
              ? 'Digite um dos seus códigos de backup'
              : 'Digite o código do seu app autenticador'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {useBackupCode ? (
            <div className="space-y-2">
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={(value) => setCode(value.toUpperCase())}
              >
                <InputOTPGroup className="justify-center font-mono">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          ) : (
            <InputOTP 
              maxLength={6} 
              value={code} 
              onChange={setCode}
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
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            onClick={useBackupCode ? handleBackupCodeVerify : handleVerify}
            disabled={loading || code.length < 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-sm"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
          >
            {useBackupCode 
              ? 'Usar código do app autenticador'
              : 'Usar código de backup'
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
