import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  delay: number;
}

export const FeatureCard = ({ icon: Icon, title, description, color, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn(
      'flex cursor-default flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg',
      `bg-gradient-to-br ${color}`
    )}
  >
    <div className="rounded-lg bg-background/80 p-2 backdrop-blur-sm">
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-center text-sm font-medium">{title}</span>
    <span className="text-center text-xs text-muted-foreground">{description}</span>
  </motion.div>
);
