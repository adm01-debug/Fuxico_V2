import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Eye, EyeOff, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { matchFirst } from '@/lib/variant';

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

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isLoading: boolean;
  isLockedOut: boolean;
  lockoutSeconds: number;
  failedAttempts: number;
  onSubmit: (e: FormEvent) => void;
}

export const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  isLockedOut,
  lockoutSeconds,
  failedAttempts,
  onSubmit,
}: LoginFormProps) => (
  <form onSubmit={onSubmit} className="mt-4 space-y-4">
    <div className="space-y-2">
      <Label htmlFor="login-email" className="text-sm font-medium">
        Email
      </Label>
      <div className="group relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
        <Input
          id="login-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 border-border/50 bg-background/50 pl-10 transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="login-password" className="text-sm font-medium">
        Senha
      </Label>
      <div className="group relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 border-border/50 bg-background/50 pl-10 pr-10 transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
          )}
          <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
        </Button>
      </div>
    </div>

    {/* Lockout warning */}
    <AnimatePresence>
      {isLockedOut && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <Lock className="h-4 w-4 flex-shrink-0" />
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
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 p-2 text-xs text-warning"
        >
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span>{5 - failedAttempts} tentativa(s) restante(s) antes do bloqueio</span>
        </motion.div>
      )}
    </AnimatePresence>

    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button
        type="submit"
        className="h-11 w-full bg-primary shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
        disabled={isLoading || isLockedOut}
      >
        {matchFirst(
          [
            [isLoading, () => <Loader2 className="h-4 w-4 animate-spin" />],
            [
              isLockedOut,
              () => (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Bloqueado ({formatLockoutTime(lockoutSeconds)})
                </>
              ),
            ],
          ],
          () => (
            <>
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )
        )}
      </Button>
    </motion.div>
  </form>
);
