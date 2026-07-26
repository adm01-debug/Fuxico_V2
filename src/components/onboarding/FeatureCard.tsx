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
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default", `bg-gradient-to-br ${color}`)}>
    <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm"><Icon className="h-5 w-5" /></div>
    <span className="text-sm font-medium text-center">{title}</span>
    <span className="text-xs text-muted-foreground text-center">{description}</span>
  </motion.div>
);
