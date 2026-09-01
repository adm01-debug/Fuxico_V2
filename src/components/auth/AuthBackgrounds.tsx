import { motion } from "framer-motion";

export const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl"
        style={{
          width: `${200 + i * 100}px`,
          height: `${200 + i * 100}px`,
          left: `${10 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
          opacity: [0.3, 0.5, 0.3, 0.3],
        }}
        transition={{
          duration: 15 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.5,
        }}
      />
    ))}
  </div>
);

export const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-grid)" />
    </svg>
  </div>
);
