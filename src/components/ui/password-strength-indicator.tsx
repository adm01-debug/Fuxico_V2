import { log } from '@/lib/logger';
import { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
  onBreachCheck?: (isBreached: boolean | null) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Número', test: (p) => /[0-9]/.test(p) },
  { label: 'Caractere especial (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const strengthConfig = {
  0: { label: 'Muito fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  1: { label: 'Fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  2: { label: 'Regular', color: 'bg-warning', textColor: 'text-warning' },
  3: { label: 'Boa', color: 'bg-warning', textColor: 'text-warning' },
  4: { label: 'Forte', color: 'bg-success', textColor: 'text-success' },
  5: { label: 'Muito forte', color: 'bg-success', textColor: 'text-success' },
};

// Check if password has been breached using HaveIBeenPwned API with k-anonymity
async function checkPasswordBreach(password: string): Promise<boolean> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Only send first 5 characters (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true' // Adds padding to prevent response length analysis
      }
    });
    
    if (!response.ok) {
      log.warn('HIBP API error:', response.status);
      return false;
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our hash suffix appears in the response
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return parseInt(count.trim(), 10) > 0;
      }
    }
    
    return false;
  } catch (error) {
    log.warn('Error checking password breach:', error);
    return false;
  }
}

export function PasswordStrengthIndicator({ 
  password, 
  className,
  showRequirements = true,
  onBreachCheck
}: PasswordStrengthIndicatorProps) {
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);
  const [isBreached, setIsBreached] = useState<boolean | null>(null);
  
  const analysis = useMemo(() => {
    const passedRequirements = requirements.filter(req => req.test(password));
    const score = passedRequirements.length;
    const config = strengthConfig[score as keyof typeof strengthConfig];
    
    return {
      score,
      maxScore: requirements.length,
      percentage: (score / requirements.length) * 100,
      passedRequirements,
      config,
    };
  }, [password]);

  // Check for breached passwords with debounce
  useEffect(() => {
    if (!password || password.length < 8) {
      setIsBreached(null);
      onBreachCheck?.(null);
      return;
    }
    
    setIsCheckingBreach(true);
    const timeoutId = setTimeout(async () => {
      const breached = await checkPasswordBreach(password);
      setIsBreached(breached);
      setIsCheckingBreach(false);
      onBreachCheck?.(breached);
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeoutId);
  }, [password, onBreachCheck]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Breach warning */}
      {isBreached && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Esta senha foi encontrada em vazamentos de dados. Escolha outra senha.</span>
        </div>
      )}
      
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn('font-medium', isBreached ? 'text-destructive' : analysis.config.textColor)}>
            {isBreached ? 'Comprometida' : analysis.config.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isBreached ? 'bg-destructive' : analysis.config.color
            )}
            style={{ width: `${isBreached ? 100 : analysis.percentage}%` }}
          />
        </div>
        {/* Segmented indicators */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-200',
                isBreached 
                  ? 'bg-destructive' 
                  : i < analysis.score ? analysis.config.color : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {requirements.map((req) => {
              const passed = req.test(password);
              return (
                <div
                  key={req.label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    passed ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {passed ? (
                    <Check className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <X className="w-3 h-3 flex-shrink-0" />
                  )}
                  <span>{req.label}</span>
                </div>
              );
            })}
          </div>
          
          {/* Breach check status */}
          <div className={cn(
            'flex items-center gap-1.5 text-xs transition-colors',
            isCheckingBreach 
              ? 'text-muted-foreground' 
              : isBreached === false 
                ? 'text-success' 
                : isBreached === true 
                  ? 'text-destructive' 
                  : 'text-muted-foreground'
          )}>
            {isCheckingBreach ? (
              <>
                <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                <span>Verificando vazamentos...</span>
              </>
            ) : isBreached === false ? (
              <>
                <Check className="w-3 h-3 flex-shrink-0" />
                <span>Senha não encontrada em vazamentos</span>
              </>
            ) : isBreached === true ? (
              <>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Senha encontrada em vazamentos</span>
              </>
            ) : password.length >= 8 ? (
              <>
                <Loader2 className="w-3 h-3 flex-shrink-0" />
                <span>Aguardando verificação...</span>
              </>
            ) : (
              <>
                <X className="w-3 h-3 flex-shrink-0" />
                <span>Verificação de vazamentos (mín. 8 caracteres)</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for password validation
export function usePasswordStrength(password: string) {
  const [isBreached, setIsBreached] = useState<boolean | null>(null);
  
  const analysis = useMemo(() => {
    const passedRequirements = requirements.filter(req => req.test(password));
    const score = passedRequirements.length;
    const isValid = score >= 4 && isBreached !== true; // At least 4 requirements met and not breached
    const isStrong = score === 5 && isBreached === false;
    
    return {
      score,
      isValid,
      isStrong,
      isBreached,
      passedCount: passedRequirements.length,
      totalCount: requirements.length,
    };
  }, [password, isBreached]);
  
  return {
    ...analysis,
    setIsBreached,
  };
}
