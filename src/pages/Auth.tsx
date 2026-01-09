// =============================================================================
// FUXICO - Premium Auth Page with Animations
// =============================================================================

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
import { Loader2, Mail, Eye, EyeOff, Lock, AlertTriangle, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';
import { PasswordStrengthIndicator, usePasswordStrength } from '@/components/ui/password-strength-indicator';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.jpg';
import { motion, AnimatePresence } from 'framer-motion';

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

// Floating particles background
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl"
        style={{
          width: `${200 + i * 100}px`,
          height: `${200 + i * 100}px`,
          left: `${10 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
          opacity: [0.3, 0.5, 0.3, 0.3],
        }}
        transition={{
          duration: 15 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.5,
        }}
      />
    ))}
  </div>
);

// Grid pattern
const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-grid)" />
    </svg>
  </div>
);

// Feature badges
const features = [
  { icon: Zap, text: "Tracking em tempo real" },
  { icon: Shield, text: "100% Seguro" },
  { icon: Sparkles, text: "IA Integrada" },
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background effects */}
      <GridPattern />
      <FloatingOrbs />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <div className="w-full px-4 sm:px-0 max-w-md relative z-10">
        {/* Logo with animation */}
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/50 to-primary/30 rounded-3xl blur-xl opacity-50" />
            <img src={logoImg} alt="FUXICO" className="relative h-20 w-20 rounded-2xl shadow-2xl" />
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-display font-bold mt-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            FUXICO
          </motion.h1>
          
          <motion.p 
            className="text-muted-foreground mt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Saiba quando seus emails são lidos
          </motion.p>

          {/* Feature badges */}
          <motion.div 
            className="flex gap-2 mt-4 flex-wrap justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.15)" }}
              >
                <feature.icon className="w-3 h-3" />
                {feature.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-display">Bem-vindo</CardTitle>
              <CardDescription>Entre para acessar o dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google Sign In */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  variant="outline"
                  className="w-full h-12 gap-3 bg-background/50 hover:bg-background/80 border-border/50 hover:border-primary/30 transition-all duration-300"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span className="font-medium">Continuar com Google</span>
                </Button>
              </motion.div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground/70 font-medium">ou</span>
                </div>
              </div>

              {/* Email/Password Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                    Criar conta
                  </TabsTrigger>
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
                      <form onSubmit={handleEmailSignIn} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="login-password"
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
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
                                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              )}
                              <span className="sr-only">
                                {showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                              </span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Lockout warning */}
                        <AnimatePresence>
                          {isLockedOut && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                            >
                              <Lock className="w-4 h-4 flex-shrink-0" />
                              <span>
                                Conta bloqueada. Aguarde {formatLockoutTime(lockoutSeconds)} para tentar novamente.
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Failed attempts warning */}
                        <AnimatePresence>
                          {!isLockedOut && failedAttempts > 0 && failedAttempts < 5 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs"
                            >
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              <span>
                                {5 - failedAttempts} tentativa(s) restante(s) antes do bloqueio
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <Button 
                            type="submit" 
                            className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
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
                                Entrar
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleEmailSignUp} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="signup-password"
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Crie uma senha forte"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
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
                                <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
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
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <Button 
                            type="submit" 
                            className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
                            disabled={isLoading || !passwordStrength.isValid}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                Criar conta
                                <Sparkles className="h-4 w-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu sua senha?
              </Link>
              <p className="text-xs text-center text-muted-foreground/60">
                Ao entrar, você concorda com nossos{' '}
                <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
                  Política de Privacidade
                </a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Bottom decoration */}
        <motion.p
          className="text-center text-xs text-muted-foreground/40 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          © 2025 FUXICO. Todos os direitos reservados.
        </motion.p>
      </div>
    </div>
  );
};

export default Auth;
