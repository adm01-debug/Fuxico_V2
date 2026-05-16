export const TRANSITIONS = {
  default: { type: "spring", stiffness: 300, damping: 30 },
  gentle: { type: "spring", stiffness: 100, damping: 20 },
  slow: { duration: 0.5, ease: "easeInOut" },
};

export const VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scaleUp: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};
