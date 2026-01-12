import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, PartyPopper, Sparkles, Trophy, Zap, Star, Rocket, Heart, Gift } from "lucide-react";
import { Button } from "./button";
import { useState, useCallback } from "react";

type ToastVariant = "success" | "celebration" | "achievement" | "milestone" | "reward" | "streak";

interface SuccessToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

const variants: Record<ToastVariant, {
  icon: typeof CheckCircle2;
  gradient: string;
  bgColor: string;
  particleColors: string[];
}> = {
  success: {
    icon: CheckCircle2,
    gradient: "from-green-500 to-emerald-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    particleColors: ["#22c55e", "#10b981", "#34d399"],
  },
  celebration: {
    icon: PartyPopper,
    gradient: "from-purple-500 to-pink-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    particleColors: ["#a855f7", "#ec4899", "#f472b6"],
  },
  achievement: {
    icon: Trophy,
    gradient: "from-yellow-500 to-orange-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    particleColors: ["#eab308", "#f97316", "#facc15"],
  },
  milestone: {
    icon: Zap,
    gradient: "from-blue-500 to-cyan-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    particleColors: ["#3b82f6", "#06b6d4", "#22d3ee"],
  },
  reward: {
    icon: Gift,
    gradient: "from-rose-500 to-red-400",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    particleColors: ["#f43f5e", "#ef4444", "#fb7185"],
  },
  streak: {
    icon: Rocket,
    gradient: "from-indigo-500 to-violet-400",
    bgColor: "bg-indigo-500/10 border-indigo-500/20",
    particleColors: ["#6366f1", "#8b5cf6", "#a78bfa"],
  },
};

const positionClasses: Record<string, string> = {
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
  "top-center": "top-6 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
};

// Floating particles effect
const FloatingParticles = ({ colors }: { colors: string[] }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: colors[i % colors.length],
          left: `${10 + (i * 12)}%`,
          top: `${20 + (i % 3) * 25}%`,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
          y: [0, -30, -50],
          x: [(i % 2 === 0 ? 10 : -10), 0, (i % 2 === 0 ? -10 : 10)],
        }}
        transition={{
          duration: 2,
          delay: i * 0.1,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    ))}
  </div>
);

export const SuccessToast = ({
  show,
  onClose,
  title,
  description,
  variant = "success",
  action,
  position = "bottom-right",
}: SuccessToastProps) => {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`fixed ${positionClasses[position]} z-50 max-w-sm p-4 rounded-xl border ${config.bgColor} backdrop-blur-xl shadow-2xl`}
        >
          {/* Particles for celebration variants */}
          {(variant === "celebration" || variant === "achievement" || variant === "reward") && (
            <FloatingParticles colors={config.particleColors} />
          )}
          
          <div className="flex items-start gap-4 relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
            >
              <Icon className="h-5 w-5 text-white" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="font-semibold text-foreground"
              >
                {title}
              </motion.p>
              {description && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground mt-1"
                >
                  {description}
                </motion.p>
              )}
              {action && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mt-3"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={action.onClick}
                    className="h-8 text-xs"
                  >
                    {action.label}
                  </Button>
                </motion.div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 flex-shrink-0 hover:bg-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sparkle decorations for celebration variants */}
          {(variant === "celebration" || variant === "achievement" || variant === "reward") && (
            <>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Star className="h-4 w-4 text-purple-400" />
              </motion.div>
            </>
          )}

          {/* Streak fire effect */}
          {variant === "streak" && (
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2"
              animate={{ 
                y: [0, -3, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <span className="text-2xl">🔥</span>
            </motion.div>
          )}

          {/* Progress bar for auto-dismiss */}
          <motion.div
            className={`absolute bottom-0 left-0 h-1 rounded-b-xl bg-gradient-to-r ${config.gradient}`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced hook with more features
export const useSuccessToast = () => {
  const [toastState, setToastState] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: ToastVariant;
    action?: { label: string; onClick: () => void };
    position?: SuccessToastProps["position"];
  }>({
    show: false,
    title: "",
  });

  const showToast = useCallback((options: Omit<typeof toastState, "show">) => {
    setToastState({ ...options, show: true });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToastState(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, show: false }));
  }, []);

  // Quick methods for common variants
  const success = useCallback((title: string, description?: string) => {
    showToast({ title, description, variant: "success" });
  }, [showToast]);

  const celebrate = useCallback((title: string, description?: string) => {
    showToast({ title, description, variant: "celebration" });
  }, [showToast]);

  const achievement = useCallback((title: string, description?: string) => {
    showToast({ title, description, variant: "achievement" });
  }, [showToast]);

  const milestone = useCallback((title: string, description?: string) => {
    showToast({ title, description, variant: "milestone" });
  }, [showToast]);

  const ToastComponent = () => (
    <SuccessToast
      show={toastState.show}
      onClose={hideToast}
      title={toastState.title}
      description={toastState.description}
      variant={toastState.variant}
      action={toastState.action}
      position={toastState.position}
    />
  );

  return { 
    showToast, 
    hideToast, 
    success, 
    celebrate, 
    achievement, 
    milestone,
    ToastComponent 
  };
};
