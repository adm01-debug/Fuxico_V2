import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cosmeticInt, cosmeticRandom, cosmeticRange } from "@/lib/secure-random";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

const colors = [
  "hsl(220, 90%, 56%)", // primary
  "hsl(262, 83%, 58%)", // accent
  "hsl(142, 71%, 45%)", // success
  "hsl(38, 92%, 50%)",  // warning
  "hsl(0, 84%, 60%)",   // destructive
  "#FFD700", // gold
  "#FF69B4", // pink
];

export const Confetti = ({ 
  trigger, 
  onComplete, 
  duration = 3000,
  particleCount = 50 
}: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      const newPieces: ConfettiPiece[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: cosmeticRange(0, 100),
        color: colors[cosmeticInt(0, colors.length - 1)],
        delay: cosmeticRange(0, 0.5),
        rotation: cosmeticRange(0, 360),
        scale: cosmeticRange(0.5, 1),
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setIsActive(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration, particleCount, onComplete, isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-3 h-3"
              style={{
                left: `${piece.x}%`,
                top: -20,
                backgroundColor: piece.color,
                borderRadius: cosmeticRandom() > 0.5 ? "50%" : "2px",
                transform: `scale(${piece.scale})`,
              }}
              initial={{ 
                y: -20, 
                opacity: 1,
                rotate: 0,
              }}
              animate={{ 
                y: "100vh",
                opacity: [1, 1, 0],
                rotate: piece.rotation * 3,
                x: [0, cosmeticRange(-100, 100), cosmeticRange(-50, 50)],
              }}
              transition={{
                duration: cosmeticRange(2, 3),
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Success checkmark animation
export const SuccessCheck = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20"
        >
          <motion.svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500"
          >
            <motion.path
              d="M20 6L9 17L4 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Celebration burst effect
export const CelebrationBurst = ({ trigger }: { trigger: boolean }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.02,
  }));

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: colors[i % colors.length],
              }}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1, 0.5],
                x: Math.cos(particle.angle) * 60,
                y: Math.sin(particle.angle) * 60,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.6,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Number counter animation
export const AnimatedNumber = ({ 
  value, 
  duration = 1000,
  className = "" 
}: { 
  value: number; 
  duration?: number;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    // `displayValue` é lido apenas como ponto de partida da animação; incluí-lo
    // reiniciaria a contagem a cada frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
};

// Pulse ring effect for notifications
export const PulseRing = ({ show, color = "primary" }: { show: boolean; color?: string }) => {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/30",
    success: "bg-green-500/30",
    warning: "bg-yellow-500/30",
    destructive: "bg-red-500/30",
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className={`absolute inset-0 rounded-full ${colorClasses[color]}`}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.div
            className={`absolute inset-0 rounded-full ${colorClasses[color]}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
    </AnimatePresence>
  );
};
