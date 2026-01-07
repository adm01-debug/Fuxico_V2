// =============================================================================
// FUXICO - Premium Stats Card with Sparklines
// =============================================================================

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Mini Sparkline Component
function Sparkline({ 
  data, 
  color = "hsl(var(--primary))",
  height = 32,
  showArea = true 
}: { 
  data: number[]; 
  color?: string;
  height?: number;
  showArea?: boolean;
}) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const width = 80;
  const padding = 2;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;
  
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <defs>
          <linearGradient id={`sparkline-gradient-${data.join('-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {showArea && (
        <polygon
          points={areaPoints}
          fill={`url(#sparkline-gradient-${data.join('-')})`}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point indicator */}
      <circle
        cx={width - padding}
        cy={padding + effectiveHeight - ((data[data.length - 1] - min) / range) * effectiveHeight}
        r="3"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
}

// Animated Number Component
function AnimatedValue({ value }: { value: string | number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="inline-block"
    >
      {value}
    </motion.span>
  );
}

// Trend Arrow Component
function TrendArrow({ value, isPositive }: { value: number; isPositive: boolean }) {
  const Icon = value === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "flex items-center gap-1 text-sm font-medium",
        value === 0 ? "text-muted-foreground" :
        isPositive ? "text-success" : "text-destructive"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{isPositive && value > 0 ? "+" : ""}{value}%</span>
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
  variant?: "default" | "primary" | "success" | "warning" | "gradient";
  onClick?: () => void;
  tooltipContent?: string;
}

const variantStyles = {
  default: "bg-card hover:bg-card/80",
  primary: "bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10",
  success: "bg-gradient-to-br from-success/10 to-success/5 hover:from-success/15 hover:to-success/10",
  warning: "bg-gradient-to-br from-warning/10 to-warning/5 hover:from-warning/15 hover:to-warning/10",
  gradient: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
};

const iconContainerStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  gradient: "bg-white/20 text-white",
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  sparklineData,
  variant = "default",
  onClick,
  tooltipContent,
}: StatsCardProps) {
  const isGradientVariant = variant === "gradient";
  
  const CardContent = (
    <motion.div 
      className={cn(
        "rounded-xl p-5 transition-all duration-300 border border-border/50",
        variantStyles[variant],
        onClick && "cursor-pointer",
        "hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5"
      )}
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Info */}
        <div className="space-y-2 flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isGradientVariant ? "text-white/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">
              <AnimatedValue value={value} />
            </p>
            {trend && <TrendArrow value={trend.value} isPositive={trend.isPositive} />}
          </div>
          
          {subtitle && (
            <p className={cn(
              "text-xs",
              isGradientVariant ? "text-white/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Right side - Icon + Sparkline */}
        <div className="flex flex-col items-end gap-2">
          <motion.div 
            className={cn(
              "rounded-xl p-3 transition-all duration-300",
              iconContainerStyles[variant]
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          
          {sparklineData && sparklineData.length > 1 && (
            <div className="opacity-80 hover:opacity-100 transition-opacity">
              <Sparkline 
                data={sparklineData} 
                color={
                  variant === "success" ? "hsl(var(--success))" :
                  variant === "warning" ? "hsl(var(--warning))" :
                  variant === "gradient" ? "rgba(255,255,255,0.8)" :
                  "hsl(var(--primary))"
                }
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (tooltipContent) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {CardContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return CardContent;
}

// Skeleton version for loading states
export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl p-5 border border-border/50 bg-card animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-11 w-11 bg-muted rounded-xl" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
