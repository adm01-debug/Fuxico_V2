import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, PartyPopper, Sparkles, Trophy, Zap } from "lucide-react";
import { Button } from "./button";

type ToastVariant = "success" | "celebration" | "achievement" | "milestone";

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
}

const variants: Record<ToastVariant, {
  icon: typeof CheckCircle2;
  gradient: string;
  bgColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    gradient: "from-green-500 to-emerald-400",
    bgColor: "bg-green-500/10 border-green-500/20",
  },
  celebration: {
    icon: PartyPopper,
    gradient: "from-purple-500 to-pink-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  achievement: {
    icon: Trophy,
    gradient: "from-yellow-500 to-orange-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
  },
  milestone: {
    icon: Zap,
    gradient: "from-blue-500 to-cyan-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
};

export const SuccessToast = ({
  show,
  onClose,
  title,
  description,
  variant = "success",
  action,
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
          className={`fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-xl border ${config.bgColor} backdrop-blur-xl shadow-2xl`}
        >
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
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
          {(variant === "celebration" || variant === "achievement") && (
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
                <Sparkles className="h-4 w-4 text-purple-400" />
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easier usage
import { useState, useCallback } from "react";

export const useSuccessToast = () => {
  const [toastState, setToastState] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: ToastVariant;
    action?: { label: string; onClick: () => void };
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

  const ToastComponent = () => (
    <SuccessToast
      show={toastState.show}
      onClose={hideToast}
      title={toastState.title}
      description={toastState.description}
      variant={toastState.variant}
      action={toastState.action}
    />
  );

  return { showToast, hideToast, ToastComponent };
};
