import { motion } from "framer-motion";

export const OrbBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        top: '-10%',
        right: '-10%',
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)',
        bottom: '-5%',
        left: '-10%',
      }}
      animate={{ scale: [1.2, 1, 1.2], rotate: [0, -30, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--success) / 0.08) 0%, transparent 70%)',
        top: '40%',
        left: '30%',
      }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
    />
  </div>
);
