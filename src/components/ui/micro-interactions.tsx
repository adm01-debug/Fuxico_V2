// =============================================================================
// FUXICO - Micro-interactions Library
// Reusable animation components for delightful UX
// =============================================================================

import { forwardRef, useState, useEffect } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types
type ButtonClickEffect = 'bounce' | 'ripple' | 'shrink' | 'glow';
type HoverEffect = 'lift' | 'glow' | 'tilt' | 'scale' | 'shine';

// ============================================
// BUTTON INTERACTIONS
// ============================================

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  effect?: ButtonClickEffect;
  children: React.ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ effect = 'bounce', className, children, ...props }, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (effect === 'ripple') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
      props.onClick?.(e);
    };

    const effectVariants = {
      bounce: {
        whileTap: { scale: 0.95 },
        whileHover: { scale: 1.02 },
      },
      shrink: {
        whileTap: { scale: 0.9 },
        whileHover: { scale: 1.05 },
      },
      glow: {
        whileTap: { scale: 0.98 },
        whileHover: { 
          scale: 1.02,
          boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
        },
      },
      ripple: {
        whileTap: { scale: 0.98 },
      },
    };

    return (
      <motion.button
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...effectVariants[effect]}
        {...props}
      >
        {children}
        
        {/* Ripple effects */}
        {effect === 'ripple' && ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// ============================================
// CARD INTERACTIONS
// ============================================

interface InteractiveCardProps extends HTMLMotionProps<'div'> {
  effect?: HoverEffect;
  children: React.ReactNode;
}

export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  ({ effect = 'lift', className, children, ...props }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);
    
    const springConfig = { stiffness: 300, damping: 20 };
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (effect === 'tilt') {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
      }
    };

    const handleMouseLeave = () => {
      if (effect === 'tilt') {
        x.set(0);
        y.set(0);
      }
    };

    const effectStyles: Record<HoverEffect, HTMLMotionProps<'div'>> = {
      lift: {
        whileHover: { 
          y: -8, 
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
        },
        transition: { duration: 0.2 },
      },
      glow: {
        whileHover: { 
          boxShadow: '0 0 30px hsl(var(--primary) / 0.3)',
        },
      },
      scale: {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      },
      tilt: {},
      shine: {
        whileHover: { scale: 1.01 },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn('relative', className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          effect === 'tilt'
            ? { rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }
            : {}
        }
        {...effectStyles[effect]}
        {...props}
      >
        {children}
        
        {/* Shine effect overlay */}
        {effect === 'shine' && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-inherit"
            initial="idle"
            whileHover="hover"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
              variants={{
                idle: { x: '-100%' },
                hover: { x: '100%' },
              }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
        )}
      </motion.div>
    );
  }
);

InteractiveCard.displayName = 'InteractiveCard';

// ============================================
// ICON ANIMATIONS
// ============================================

interface AnimatedIconProps {
  icon: React.ReactNode;
  animation?: 'bounce' | 'spin' | 'pulse' | 'wiggle' | 'pop';
  isActive?: boolean;
  className?: string;
}

export function AnimatedIcon({ 
  icon, 
  animation = 'bounce', 
  isActive = false,
  className 
}: AnimatedIconProps) {
  const getAnimationProps = () => {
    switch (animation) {
      case 'bounce':
        return {
          animate: isActive ? { y: [0, -5, 0] } : { y: 0 },
          transition: { duration: 0.3, repeat: isActive ? Infinity : 0, repeatDelay: 0.5 },
        };
      case 'spin':
        return {
          animate: isActive ? { rotate: 360 } : { rotate: 0 },
          transition: { duration: 1, repeat: isActive ? Infinity : 0, ease: "linear" as const },
        };
      case 'pulse':
        return {
          animate: isActive ? { scale: [1, 1.1, 1] } : { scale: 1 },
          transition: { duration: 0.5, repeat: isActive ? Infinity : 0 },
        };
      case 'wiggle':
        return {
          animate: isActive ? { rotate: [0, -10, 10, -10, 10, 0] } : { rotate: 0 },
          transition: { duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 },
        };
      case 'pop':
        return {
          animate: isActive ? { scale: [1, 1.3, 1] } : { scale: 1 },
          transition: { duration: 0.2 },
        };
      default:
        return {};
    }
  };

  return (
    <motion.span
      className={cn('inline-flex', className)}
      {...getAnimationProps()}
    >
      {icon}
    </motion.span>
  );
}

// ============================================
// SKELETON LOADERS
// ============================================

interface ShimmerProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Shimmer({ className, rounded = 'md' }: ShimmerProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div className={cn('relative overflow-hidden bg-muted', roundedClass[rounded], className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ============================================
// COUNTER ANIMATION
// ============================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1,
  className,
  prefix = '',
  suffix = '',
  formatter = (v) => Math.round(v).toLocaleString(),
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const displayValue = useTransform(springValue, (v) => formatter(v));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </motion.span>
  );
}

// ============================================
// PROGRESS ANIMATIONS
// ============================================

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  color?: string;
  animated?: boolean;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  showValue = false,
  color = 'bg-primary',
  animated = true,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('relative h-2 bg-muted rounded-full overflow-hidden', className)}>
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>
      {showValue && (
        <motion.span
          className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
}

// ============================================
// STAGGER ANIMATIONS
// ============================================

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL REVEAL
// ============================================

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}

export function ScrollReveal({ 
  children, 
  className,
  direction = 'up',
  delay = 0
}: ScrollRevealProps) {
  const directionOffset = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedButton;
