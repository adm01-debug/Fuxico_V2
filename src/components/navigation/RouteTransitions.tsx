import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface RouteTransitionsProps {
  children: ReactNode;
}

/**
 * Aplica transições suaves entre rotas. Respeita `prefers-reduced-motion`
 * e o toggle de acessibilidade do usuário.
 */
export function RouteTransitions({ children }: RouteTransitionsProps) {
  const location = useLocation();
  let reducedMotion = false;
  try {
    // Contexto pode não estar disponível em testes.
    reducedMotion = useAccessibility()?.reducedMotion ?? false;
  } catch {
    reducedMotion = false;
  }

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default RouteTransitions;
