import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";

interface RouteTransitionsProps {
  children: ReactNode;
}

/**
 * Aplica transições suaves entre rotas. Respeita `prefers-reduced-motion`.
 */
export function RouteTransitions({ children }: RouteTransitionsProps) {
  const location = useLocation();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

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
        className="min-h-full relative"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default RouteTransitions;
