import { log } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';

type VerificationStatus = 'loading' | 'success' | 'error' | 'resent';

export default function VerifyEmail() {
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check for tokens in URL hash (Supabase email confirmation)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'signup') {
          // Set the session with the tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) throw error;

          setStatus('success');
          toast.success('Email verificado com sucesso!');
          
          // Redirect to dashboard after success
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // No token, check if user is already verified
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.email_confirmed_at) {
            setStatus('success');
            setTimeout(() => navigate('/'), 2000);
          } else if (session?.user?.email) {
            setEmail(session.user.email);
            setStatus('error');
          } else {
            setStatus('error');
          }
        }
      } catch (err) {
        log.error('Verification error:', err);
        setStatus('error');
        toast.error('Erro ao verificar email');
      }
    };

    verifyEmail();
  }, [navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Não foi possível reenviar. Faça login novamente.');
      return;
    }

    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) throw error;

      setStatus('resent');
      toast.success('Email de verificação reenviado!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reenviar email';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {status === 'loading' && (
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <CardTitle>Verificando Email</CardTitle>
            <CardDescription>
              Aguarde enquanto verificamos seu email...
            </CardDescription>
          </CardHeader>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>Email Verificado!</CardTitle>
              <CardDescription>
                Seu email foi verificado com sucesso. Você será redirecionado...
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/')}>
                Ir para Dashboard
              </Button>
            </CardFooter>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>Verificação Pendente</CardTitle>
              <CardDescription>
                {email 
                  ? `Enviamos um email de verificação para ${email}. Verifique sua caixa de entrada e spam.`
                  : 'Não foi possível verificar seu email. O link pode ter expirado.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {email && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleResendVerification}
                  disabled={resending}
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Reenviar email de verificação
                    </>
                  )}
                </Button>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Voltar para Login
              </Button>
            </CardFooter>
          </>
        )}

        {status === 'resent' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Email Reenviado!</CardTitle>
              <CardDescription>
                Um novo email de verificação foi enviado para <strong>{email}</strong>. 
                Verifique sua caixa de entrada e spam.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={handleResendVerification} disabled={resending}>
                {resending ? 'Reenviando...' : 'Reenviar novamente'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
                Voltar para Login
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
