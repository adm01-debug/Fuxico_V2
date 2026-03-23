import { type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Eye, EyeOff, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  email, setEmail, password, setPassword,
  showPassword, setShowPassword,
  isLoading, isLockedOut, lockoutSeconds, failedAttempts,
  onSubmit,
}: LoginFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4 mt-4">
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
          type={showPassword ? "text" : "password"}
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
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          )}
          <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
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
          <span>Conta bloqueada. Aguarde {formatLockoutTime(lockoutSeconds)} para tentar novamente.</span>
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
          <span>{5 - failedAttempts} tentativa(s) restante(s) antes do bloqueio</span>
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
);
