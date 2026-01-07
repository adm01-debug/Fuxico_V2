/**
 * Premium Search Input Component
 * 
 * @description Input de busca com animações premium, sugestões e atalhos
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Loader2, 
  Sparkles,
  Command,
  ArrowRight,
  History,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// ============================================================================
// Types
// ============================================================================

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
}

interface PremiumSearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceMs?: number;
  className?: string;
  showClear?: boolean;
  autoFocus?: boolean;
  showShortcut?: boolean;
  shortcutKey?: string;
  suggestions?: SearchSuggestion[];
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'elevated';
}

// ============================================================================
// Animations
// ============================================================================

const inputVariants = {
  focused: { 
    scale: 1.01,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  },
  unfocused: { 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  },
};

const iconVariants = {
  searching: {
    rotate: [0, 15, -15, 0],
    transition: { duration: 0.5, repeat: Infinity }
  },
  idle: { rotate: 0 },
};

const suggestionVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: 'auto',
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    height: 0,
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// Size Configuration
// ============================================================================

const sizeConfig = {
  sm: {
    input: 'h-9 text-sm pl-9 pr-9',
    icon: 'h-4 w-4',
    iconLeft: 'left-2.5',
    button: 'h-6 w-6',
  },
  default: {
    input: 'h-10 pl-10 pr-10',
    icon: 'h-4 w-4',
    iconLeft: 'left-3',
    button: 'h-7 w-7',
  },
  lg: {
    input: 'h-12 text-lg pl-12 pr-12',
    icon: 'h-5 w-5',
    iconLeft: 'left-4',
    button: 'h-8 w-8',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function PremiumSearchInput({
  value: externalValue,
  onChange,
  placeholder = 'Buscar...',
  isLoading = false,
  debounceMs = 300,
  className,
  showClear = true,
  autoFocus = false,
  showShortcut = true,
  shortcutKey = 'K',
  suggestions = [],
  onSuggestionClick,
  size = 'default',
  variant = 'default',
}: PremiumSearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = sizeConfig[size];

  // Debounce
  const debouncedValue = useDebouncedValue(internalValue, debounceMs);

  // Sync external value
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // Trigger onChange on debounced value
  useEffect(() => {
    if (debouncedValue !== externalValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, externalValue]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, isFocused]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow click
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInternalValue(suggestion.text);
    onChange(suggestion.text);
    onSuggestionClick?.(suggestion);
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return History;
      case 'trending':
        return TrendingUp;
      default:
        return Sparkles;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <motion.div
        variants={inputVariants}
        animate={isFocused ? 'focused' : 'unfocused'}
        className="relative"
      >
        {/* Glow effect when focused */}
        <AnimatePresence>
          {isFocused && variant === 'elevated' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -m-1 rounded-lg bg-primary/10 blur-md pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Search Icon */}
        <motion.div
          variants={iconVariants}
          animate={isLoading ? 'searching' : 'idle'}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10",
            config.iconLeft
          )}
        >
          {isLoading ? (
            <Loader2 className={cn(config.icon, "animate-spin text-primary")} />
          ) : (
            <Search className={cn(
              config.icon,
              "transition-colors duration-200",
              isFocused && "text-primary"
            )} />
          )}
        </motion.div>

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          className={cn(
            config.input,
            "transition-all duration-200",
            variant === 'ghost' && "border-transparent bg-muted/50 hover:bg-muted focus:bg-background",
            variant === 'elevated' && "shadow-sm focus:shadow-md",
            isFocused && "ring-2 ring-primary/20"
          )}
        />

        {/* Right side actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {/* Loading indicator */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className={cn(config.icon, "animate-spin text-primary")} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clear button */}
          <AnimatePresence mode="wait">
            {showClear && internalValue && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(config.button, "hover:bg-muted")}
                  onClick={handleClear}
                >
                  <X className={config.icon} />
                  <span className="sr-only">Limpar busca</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Keyboard shortcut indicator */}
          {showShortcut && !internalValue && !isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden sm:flex items-center gap-0.5 text-xs text-muted-foreground"
            >
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium flex">
                <Command className="h-3 w-3" />
                {shortcutKey}
              </kbd>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            variants={suggestionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="py-2">
              {suggestions.map((suggestion, index) => {
                const SuggestionIcon = getSuggestionIcon(suggestion.type);
                return (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <SuggestionIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{suggestion.text}</span>
                    {suggestion.type === 'trending' && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Simpler variant for inline use
// ============================================================================

export function SimpleSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  isLoading = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {value && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default PremiumSearchInput;
