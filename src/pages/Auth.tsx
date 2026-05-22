// =============================================================================
// FUXICO - Auth Page (Decomposed)
// =============================================================================

import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { log } from '@/lib/logger';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

import { FloatingOrbs, GridPattern } from '@/components/auth/AuthBackgrounds';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formatLockoutTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} segundos`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes} minutos`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
};

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBreached, setIsBreached] = useState<boolean | null>(null);
  const [authReason, setAuthReason] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'idle') {
      setAuthReason('Sua sessão expirou por inatividade. Por favor, entre novamente.');
    }
  }, []);

  const passwordStrength = useMemo(() => {
    const pwRequirements = [
      { test: (p: string) => p.length >= 8 },
      { test: (p: string) => /[A-Z]/.test(p) },
      { test: (p: string) => /[a-z]/.test(p) },
      { test: (p: string) => /[0-9]/.test(p) },
      { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    const passed = pwRequirements.filter(req => req.test(signupPassword));
    return {
      score: passed.length,
      isValid: passed.length >= 4 && isBreached !== true,
      isStrong: passed.length === 5 && isBreached === false,
      isBreached,
    };
  }, [signupPassword, isBreached]);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) { setIsLockedOut(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const checkLockoutStatus = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck) return;
    try {
      const { data, error } = await supabase.rpc('check_lockout_status', { _email: emailToCheck.toLowerCase() });
      if (!error && data && data.length > 0) {
        const status = data[0];
        if (status.is_locked) {
          setIsLockedOut(true);
          setLockoutSeconds(status.lockout_remaining_seconds);
          setFailedAttempts(status.failed_attempts);
        } else {
          setIsLockedOut(false);
          setLockoutSeconds(0);
          setFailedAttempts(status.failed_attempts || 0);
        }
      }
    } catch (err) { log.warn('Error checking lockout status', err); }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => { if (email) checkLockoutStatus(email); }, 500);
    return () => clearTimeout(debounce);
  }, [email, checkLockoutStatus]);

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);
  if (user) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (error) {
      toast({ title: 'Erro ao entrar com Google', description: error instanceof Error ? error.message : 'Tente novamente mais tarde', variant: 'destructive' });
    } finally { setIsGoogleLoading(false); }
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha email e senha', variant: 'destructive' });
      return;
    }
    if (isLockedOut) {
      toast({ title: 'Conta bloqueada', description: `Aguarde ${formatLockoutTime(lockoutSeconds)} para tentar novamente`, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      try {
        const { data } = await supabase.rpc('record_failed_login', { _email: email.toLowerCase() });
        if (data && data.length > 0) {
          const result = data[0];
          setFailedAttempts(result.total_attempts);
          if (result.is_now_locked) {
            setIsLockedOut(true);
            setLockoutSeconds(result.lockout_seconds);
            toast({ title: 'Conta bloqueada temporariamente', description: `Muitas tentativas falhadas. Aguarde ${formatLockoutTime(result.lockout_seconds)}.`, variant: 'destructive' });
          } else {
            const remaining = 5 - result.total_attempts;
            toast({ title: 'Erro ao entrar', description: remaining > 0 ? `Email ou senha incorretos. ${remaining} tentativa(s) restante(s).` : 'Email ou senha incorretos.', variant: 'destructive' });
          }
        }
      } catch (err) {
        log.warn('Error recording failed login', err);
        toast({ title: 'Erro ao entrar', description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message, variant: 'destructive' });
      }
    } else {
      try { await supabase.rpc('reset_login_lockout', { _email: email.toLowerCase() }); }
      catch (err) { log.warn('Error resetting lockout', err); }
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !signupPassword) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha email e senha', variant: 'destructive' });
      return;
    }
    if (!passwordStrength.isValid) {
      toast({
        title: passwordStrength.isBreached ? 'Senha comprometida' : 'Senha muito fraca',
        description: passwordStrength.isBreached ? 'Esta senha foi encontrada em vazamentos de dados. Escolha outra.' : 'A senha deve atender pelo menos 4 requisitos de segurança',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    const { error } = await signUpWithEmail(email, signupPassword);
    if (error) {
      toast({
        title: error.message.includes('already registered') ? 'Email já cadastrado' : 'Erro ao criar conta',
        description: error.message.includes('already registered') ? 'Este email já possui uma conta. Tente fazer login.' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar o cadastro.' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <GridPattern />
      <FloatingOrbs />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      <div className="w-full px-4 sm:px-0 max-w-md relative z-10">
        <AuthHeader />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          {authReason && (
            <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sessão Expirada</AlertTitle>
              <AlertDescription>{authReason}</AlertDescription>
            </Alert>
          )}
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-display">Bem-vindo</CardTitle>
              <CardDescription>Entre para acessar o dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleSignInButton isLoading={isGoogleLoading} onClick={handleGoogleSignIn} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground/70 font-medium">ou</span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Entrar</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Criar conta</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: activeTab === 'login' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === 'login' ? 10 : -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent value="login" className="mt-0">
                      <LoginForm
                        email={email} setEmail={setEmail}
                        password={password} setPassword={setPassword}
                        showPassword={showLoginPassword} setShowPassword={setShowLoginPassword}
                        isLoading={isLoading} isLockedOut={isLockedOut}
                        lockoutSeconds={lockoutSeconds} failedAttempts={failedAttempts}
                        onSubmit={handleEmailSignIn}
                      />
                    </TabsContent>
                    <TabsContent value="signup" className="mt-0">
                      <SignupForm
                        email={email} setEmail={setEmail}
                        password={signupPassword} setPassword={setSignupPassword}
                        showPassword={showSignupPassword} setShowPassword={setShowSignupPassword}
                        isLoading={isLoading} isValid={passwordStrength.isValid}
                        onBreachCheck={setIsBreached}
                        onSubmit={handleEmailSignUp}
                      />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Esqueceu sua senha?
              </Link>
              <p className="text-xs text-center text-muted-foreground/60">
                Ao entrar, você concorda com nossos{' '}
                <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Termos de Uso</a>{' '}e{' '}
                <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Política de Privacidade</a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.p className="text-center text-xs text-muted-foreground/40 mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          © {new Date().getFullYear()} FUXICO. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default Auth;
