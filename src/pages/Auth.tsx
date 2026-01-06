import { log } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { PasswordStrengthIndicator, usePasswordStrength } from '@/components/ui/password-strength-indicator';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.jpg';

// Format seconds to readable time
const formatLockoutTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} segundos`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}min ${remainingSeconds}s` 
      : `${minutes} minutos`;
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
  
  // Lockout state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  const passwordStrength = usePasswordStrength(signupPassword);
  
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            setIsLockedOut(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  // Check lockout status when email changes
  const checkLockoutStatus = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck) return;
    
    try {
      const { data, error } = await supabase.rpc('check_lockout_status', {
        _email: emailToCheck.toLowerCase()
      });
      
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
    } catch (err) {
      log.warn('Error checking lockout status', err);
    }
  }, []);

  // Check lockout when email field loses focus
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (email) {
        checkLockoutStatus(email);
      }
    }, 500);
    return () => clearTimeout(debounce);
  }, [email, checkLockoutStatus]);

  // Handle breach check callback
  const handleBreachCheck = (isBreached: boolean | null) => {
    passwordStrength.setIsBreached(isBreached);
  };

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: 'Erro ao entrar com Google',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha email e senha',
        variant: 'destructive',
      });
      return;
    }

    // Check if locked out
    if (isLockedOut) {
      toast({
        title: 'Conta bloqueada',
        description: `Aguarde ${formatLockoutTime(lockoutSeconds)} para tentar novamente`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithEmail(email, password);
    
    if (error) {
      // Record failed attempt
      try {
        const { data } = await supabase.rpc('record_failed_login', {
          _email: email.toLowerCase()
        });
        
        if (data && data.length > 0) {
          const result = data[0];
          setFailedAttempts(result.total_attempts);
          
          if (result.is_now_locked) {
            setIsLockedOut(true);
            setLockoutSeconds(result.lockout_seconds);
            toast({
              title: 'Conta bloqueada temporariamente',
              description: `Muitas tentativas falhadas. Aguarde ${formatLockoutTime(result.lockout_seconds)}.`,
              variant: 'destructive',
            });
          } else {
            const remainingAttempts = 5 - result.total_attempts;
            toast({
              title: 'Erro ao entrar',
              description: remainingAttempts > 0 
                ? `Email ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).`
                : 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        log.warn('Error recording failed login', err);
        toast({
          title: 'Erro ao entrar',
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
          variant: 'destructive',
        });
      }
    } else {
      // Reset lockout on successful login
      try {
        await supabase.rpc('reset_login_lockout', { _email: email.toLowerCase() });
      } catch (err) {
        log.warn('Error resetting lockout', err);
      }
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !signupPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha email e senha',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordStrength.isValid) {
      toast({
        title: passwordStrength.isBreached ? 'Senha comprometida' : 'Senha muito fraca',
        description: passwordStrength.isBreached 
          ? 'Esta senha foi encontrada em vazamentos de dados. Escolha outra.'
          : 'A senha deve atender pelo menos 4 requisitos de segurança',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUpWithEmail(email, signupPassword);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já possui uma conta. Tente fazer login.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar o cadastro.',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} alt="FUXICO" className="h-16 w-16 rounded-2xl mb-4" />
          <h1 className="text-3xl font-bold text-foreground">FUXICO</h1>
          <p className="text-muted-foreground mt-1">Saiba quando seus emails são lidos</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>Entre para acessar o dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-12 gap-3"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Email/Password Tabs */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleEmailSignIn} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        tabIndex={-1}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  {/* Lockout warning */}
                  {isLockedOut && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Conta bloqueada. Aguarde {formatLockoutTime(lockoutSeconds)} para tentar novamente.
                      </span>
                    </div>
                  )}
                  
                  {/* Failed attempts warning */}
                  {!isLockedOut && failedAttempts > 0 && failedAttempts < 5 && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-warning/10 border border-warning/20 text-warning text-xs">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      <span>
                        {5 - failedAttempts} tentativa(s) restante(s) antes do bloqueio
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || isLockedOut}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLockedOut ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloqueado ({formatLockoutTime(lockoutSeconds)})
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleEmailSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Crie uma senha forte"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        tabIndex={-1}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </Button>
                    </div>
                    <PasswordStrengthIndicator 
                      password={signupPassword} 
                      onBreachCheck={handleBreachCheck}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !passwordStrength.isValid}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos termos de uso.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
