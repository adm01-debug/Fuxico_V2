// =============================================================================
// FUXICO - Enhanced Form Feedback Components
// Better form states, validation feedback, and input animations
// =============================================================================

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types
interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  isValidating?: boolean;
  showPasswordToggle?: boolean;
}

// Animated error/success message
const FormMessage = ({ 
  type, 
  message 
}: { 
  type: 'error' | 'success' | 'hint'; 
  message: string;
}) => {
  const config = {
    error: {
      icon: AlertCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    success: {
      icon: Check,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    hint: {
      icon: null,
      color: 'text-muted-foreground',
      bg: '',
    },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-center gap-1.5 text-sm mt-1.5', config.color)}
    >
      {config.icon && <config.icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{message}</span>
    </motion.div>
  );
};

// Form field wrapper with label and messages
export function FormField({
  label,
  error,
  success,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className={cn('flex items-center gap-1', error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <FormMessage key="error" type="error" message={error} />
        ) : success ? (
          <FormMessage key="success" type="success" message={success} />
        ) : hint ? (
          <FormMessage key="hint" type="hint" message={hint} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Validated input with built-in feedback
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ 
    label, 
    error, 
    success, 
    hint, 
    isValidating, 
    showPasswordToggle,
    type,
    className,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = showPasswordToggle 
      ? (showPassword ? 'text' : 'password') 
      : type;

    const getStateIcon = () => {
      if (isValidating) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      }
      if (error) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-destructive"
          >
            <X className="h-4 w-4" />
          </motion.div>
        );
      }
      if (success) {
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-green-600"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        );
      }
      return null;
    };

    return (
      <FormField label={label} error={error} success={success} hint={hint}>
        <div className="relative">
          <motion.div
            animate={{
              scale: isFocused ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={ref}
              type={inputType}
              className={cn(
                'pr-10 transition-all duration-200',
                error && 'border-destructive focus-visible:ring-destructive/30',
                success && 'border-green-500 focus-visible:ring-green-500/30',
                isFocused && 'shadow-md',
                className
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              {...props}
            />
          </motion.div>
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            {getStateIcon()}
          </div>
        </div>
      </FormField>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Animated form submit button
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  isSuccess?: boolean;
  loadingText?: string;
  successText?: string;
}

export function SubmitButton({
  children,
  isLoading,
  isSuccess,
  loadingText = 'Enviando...',
  successText = 'Enviado!',
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <motion.button
      type="submit"
      className={cn(
        'relative w-full h-11 px-6 rounded-lg font-medium transition-all duration-200',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isSuccess && 'bg-green-600 hover:bg-green-600',
        className
      )}
      disabled={disabled || isLoading || isSuccess}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </motion.span>
        ) : isSuccess ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <Check className="h-5 w-5" />
            </motion.div>
            {successText}
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Character counter for textareas
interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage > 80;
  const isError = percentage >= 100;

  return (
    <motion.div
      className={cn(
        'text-xs text-muted-foreground transition-colors',
        isWarning && !isError && 'text-yellow-600',
        isError && 'text-destructive',
        className
      )}
      animate={{
        scale: isError ? [1, 1.1, 1] : 1,
      }}
    >
      <span className={cn(isError && 'font-semibold')}>{current}</span>
      <span className="opacity-50">/{max}</span>
    </motion.div>
  );
}

// Inline field validation
interface InlineValidationProps {
  rules: Array<{
    label: string;
    isValid: boolean;
  }>;
  className?: string;
}

export function InlineValidation({ rules, className }: InlineValidationProps) {
  return (
    <div className={cn('space-y-1.5 mt-2', className)}>
      {rules.map((rule, index) => (
        <motion.div
          key={index}
          className={cn(
            'flex items-center gap-2 text-xs transition-colors',
            rule.isValid ? 'text-green-600' : 'text-muted-foreground'
          )}
          initial={false}
          animate={{
            opacity: rule.isValid ? 1 : 0.6,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: rule.isValid ? 1 : 0.8,
              backgroundColor: rule.isValid ? 'hsl(142 76% 36%)' : 'hsl(var(--muted))',
            }}
            className="h-4 w-4 rounded-full flex items-center justify-center"
          >
            <Check className={cn('h-2.5 w-2.5', rule.isValid ? 'text-white' : 'text-muted-foreground')} />
          </motion.div>
          <span>{rule.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// Shake animation for errors
export function ShakeOnError({ 
  hasError, 
  children 
}: { 
  hasError: boolean; 
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={hasError ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default FormField;
