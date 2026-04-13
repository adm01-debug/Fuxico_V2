import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { emptyStateConfigs, type EmptyStateType } from "./empty-state-configs";

export type { EmptyStateType };

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  } | React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const EmptyState = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) => {
  const config = emptyStateConfigs[type];

  const sizeClasses = { sm: "py-8 px-4", md: "py-12 px-6", lg: "py-16 px-8" };
  const titleClasses = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  const renderAction = () => {
    if (!action && !onAction) return null;

    if (action && typeof action === 'object' && 'label' in action && 'onClick' in action) {
      const actionObj = action as { label: string; onClick: () => void; icon?: React.ReactNode };
      return (
        <Button onClick={actionObj.onClick}
          className={`gap-2 bg-gradient-to-r ${config.gradient} text-white border-0 hover:opacity-90 transition-opacity`}>
          {actionObj.icon}
          {actionObj.label}
        </Button>
      );
    }

    if (action && React.isValidElement(action)) return action;

    if (onAction) {
      return (
        <Button onClick={onAction}
          className={`gap-2 bg-gradient-to-r ${config.gradient} text-white border-0 hover:opacity-90 transition-opacity`}>
          <Plus className="h-4 w-4" />
          {actionLabel || config.actionLabel}
        </Button>
      );
    }

    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      {size !== "sm" && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
          {config.illustration}
        </motion.div>
      )}

      <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className={`font-semibold font-display mb-2 ${titleClasses[size]}`}>
        {title || config.title}
      </motion.h3>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6">
        {description || config.description}
      </motion.p>

      {(onAction || action) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {renderAction()}
        </motion.div>
      )}
    </motion.div>
  );
};
