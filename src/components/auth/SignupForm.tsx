import { type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { motion } from 'framer-motion';

interface SignupFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isLoading: boolean;
  isValid: boolean;
  onBreachCheck: (v: boolean | null) => void;
  onSubmit: (e: FormEvent) => void;
}

export const SignupForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  isValid,
  onBreachCheck,
  onSubmit,
}: SignupFormProps) => (
  <form onSubmit={onSubmit} className="mt-4 space-y-4">
    <div className="space-y-2">
      <Label htmlFor="signup-email" className="text-sm font-medium">
        Email
      </Label>
      <div className="group relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
        <Input
          id="signup-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 border-border/50 bg-background/50 pl-10 transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="signup-password" className="text-sm font-medium">
        Senha
      </Label>
      <div className="group relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
        <Input
          id="signup-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Crie uma senha forte"
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
      <PasswordStrengthIndicator password={password} onBreachCheck={onBreachCheck} />
    </div>
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button
        type="submit"
        className="h-11 w-full bg-primary shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
        disabled={isLoading || !isValid}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Criar conta
            <Sparkles className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </motion.div>
  </form>
);
