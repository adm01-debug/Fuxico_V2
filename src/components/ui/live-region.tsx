import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps {
  /** The message to announce */
  message?: string;
  /** Politeness level: polite waits for user to finish, assertive interrupts */
  politeness?: "polite" | "assertive";
  /** Whether the region is visible or screen-reader only */
  visible?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Auto-clear message after this many milliseconds */
  clearAfter?: number;
}

/**
 * Live Region Component - WCAG 2.1 AA Compliant
 * 
 * Announces dynamic content changes to screen reader users.
 * Use for notifications, form validation, loading states, etc.
 */
export function LiveRegion({
  message = "",
  politeness = "polite",
  visible = false,
  className,
  clearAfter,
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (visible) {
    return (
      <div
        role="status"
        aria-live={politeness}
        aria-atomic="true"
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "max-w-sm p-4",
          "bg-background border border-border rounded-lg shadow-lg",
          "animate-in slide-in-from-right-5",
          className
        )}
      >
        {currentMessage}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook for managing live region announcements
 */
export function useLiveAnnouncement() {
  const [announcement, setAnnouncement] = useState("");
  const [politeness, setPoliteness] = useState<"polite" | "assertive">("polite");

  const announce = useCallback((
    message: string, 
    level: "polite" | "assertive" = "polite"
  ) => {
    // Clear and re-set to trigger re-announcement of same message
    setAnnouncement("");
    setPoliteness(level);
    
    // Small delay ensures screen reader picks up the change
    requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const clear = useCallback(() => {
    setAnnouncement("");
  }, []);

  return {
    announcement,
    politeness,
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion message={announcement} politeness={politeness} />
    ),
  };
}

/**
 * Loading Announcement Component
 * Announces loading states to screen reader users
 */
interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

export function LoadingAnnouncement({
  isLoading,
  loadingMessage = "Carregando...",
  completeMessage = "Conteúdo carregado",
}: LoadingAnnouncementProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoading) {
      setMessage(loadingMessage);
    } else if (message === loadingMessage) {
      setMessage(completeMessage);
      // Clear after announcement
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingMessage, completeMessage, message]);

  return <LiveRegion message={message} politeness="polite" />;
}

/**
 * Form Validation Announcement
 * Announces form validation errors to screen reader users
 */
interface ValidationAnnouncementProps {
  errors: string[];
  politeness?: "polite" | "assertive";
}

export function ValidationAnnouncement({
  errors,
  politeness = "assertive",
}: ValidationAnnouncementProps) {
  const message = errors.length > 0
    ? `${errors.length} ${errors.length === 1 ? 'erro' : 'erros'} no formulário: ${errors.join('. ')}`
    : "";

  return <LiveRegion message={message} politeness={politeness} />;
}

export default LiveRegion;
