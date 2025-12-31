import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
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
  { label: 'Caractere especial', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const strengthConfig = {
  0: { label: 'Muito fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  1: { label: 'Fraca', color: 'bg-destructive', textColor: 'text-destructive' },
  2: { label: 'Regular', color: 'bg-warning', textColor: 'text-warning' },
  3: { label: 'Boa', color: 'bg-warning', textColor: 'text-warning' },
  4: { label: 'Forte', color: 'bg-success', textColor: 'text-success' },
  5: { label: 'Muito forte', color: 'bg-success', textColor: 'text-success' },
};

export function PasswordStrengthIndicator({ 
  password, 
  className,
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
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

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn('font-medium', analysis.config.textColor)}>
            {analysis.config.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              analysis.config.color
            )}
            style={{ width: `${analysis.percentage}%` }}
          />
        </div>
        {/* Segmented indicators */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-200',
                i < analysis.score ? analysis.config.color : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
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
      )}
    </div>
  );
}

// Hook for password validation
export function usePasswordStrength(password: string) {
  return useMemo(() => {
    const passedRequirements = requirements.filter(req => req.test(password));
    const score = passedRequirements.length;
    const isValid = score >= 4; // At least 4 requirements met
    const isStrong = score === 5;
    
    return {
      score,
      isValid,
      isStrong,
      passedCount: passedRequirements.length,
      totalCount: requirements.length,
    };
  }, [password]);
}
