import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip Link Component - WCAG 2.1 AA Compliant
 * 
 * Allows keyboard users to skip repetitive navigation and jump directly to main content.
 * Invisible by default, becomes visible when focused.
 */
export function SkipLink({ 
  href = "#main-content", 
  children = "Pular para o conteúdo principal",
  className 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        "absolute left-0 top-0 z-[9999]",
        "transform -translate-y-full",
        // Styling
        "bg-primary text-primary-foreground",
        "px-6 py-3 font-semibold text-sm",
        "rounded-b-lg shadow-lg",
        // Visible on focus
        "focus:translate-y-0",
        "transition-transform duration-200",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Group - Multiple skip links for complex layouts
 */
interface SkipLinksProps {
  links?: Array<{ href: string; label: string }>;
  className?: string;
}

export function SkipLinks({ 
  links = [
    { href: "#main-content", label: "Pular para o conteúdo principal" },
    { href: "#navigation", label: "Pular para a navegação" },
  ],
  className 
}: SkipLinksProps) {
  return (
    <nav 
      aria-label="Links de atalho" 
      className={cn("skip-links-container", className)}
    >
      <ul className="flex flex-col gap-1">
        {links.map((link, index) => (
          <li key={index}>
            <SkipLink href={link.href}>{link.label}</SkipLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Main Content Wrapper - Target for skip link
 */
interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function MainContent({ 
  children, 
  id = "main-content",
  className,
  as: Component = "main"
}: MainContentProps) {
  return (
    <Component
      id={id}
      tabIndex={-1}
      className={cn(
        "outline-none focus:outline-none",
        className
      )}
      aria-label="Conteúdo principal"
    >
      {children}
    </Component>
  );
}

export default SkipLink;
