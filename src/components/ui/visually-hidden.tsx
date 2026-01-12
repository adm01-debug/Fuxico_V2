import { cn } from "@/lib/utils";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
  /** Make visible when focused (for skip links, etc.) */
  focusable?: boolean;
  /** HTML element to render as */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Visually Hidden Component - WCAG 2.1 AA Compliant
 * 
 * Hides content visually while keeping it accessible to screen readers.
 * Perfect for:
 * - Additional context for screen reader users
 * - Skip links that should only appear on focus
 * - Form labels that are visually represented by icons
 * - Status messages
 */
export function VisuallyHidden({
  children,
  className,
  focusable = false,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Visually hidden styles
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        // Focusable variant
        focusable && [
          "focus:static focus:w-auto focus:h-auto focus:p-2",
          "focus:m-0 focus:overflow-visible focus:whitespace-normal",
          "focus:[clip:auto]",
          "focus:bg-primary focus:text-primary-foreground",
          "focus:rounded-md focus:shadow-lg focus:z-50",
        ],
        className
      )}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
    </Component>
  );
}

/**
 * Screen Reader Only Text
 * Shorter alias for VisuallyHidden
 */
export function SrOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("sr-only", className)}>
      {children}
    </span>
  );
}

/**
 * Accessible Icon Wrapper
 * Wraps icons with screen reader text
 */
interface AccessibleIconProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function AccessibleIcon({ icon, label, className }: AccessibleIconProps) {
  return (
    <span className={cn("inline-flex items-center", className)} role="img" aria-label={label}>
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

/**
 * Accessible Loading Indicator
 */
interface AccessibleLoadingProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function AccessibleLoading({
  size = "md",
  label = "Carregando...",
  className,
}: AccessibleLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
}

export default VisuallyHidden;
