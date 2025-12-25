import { useState } from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: SkipLinkProps) {
  const [focused, setFocused] = useState(false);

  return (
    <a
      href={href}
      className={`
        fixed top-0 left-0 z-[9999] px-4 py-2 bg-primary text-primary-foreground
        font-medium text-sm rounded-br-md transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${focused ? 'translate-y-0' : '-translate-y-full'}
      `}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </a>
  );
}

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

export function LiveRegion({ 
  children, 
  politeness = 'polite',
  atomic = true 
}: { 
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

export function FocusTrap({ 
  children, 
  active = true 
}: { 
  children: React.ReactNode;
  active?: boolean;
}) {
  if (!active) return <>{children}</>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="focus:outline-none"
    >
      {children}
    </div>
  );
}
