import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-primary text-primary-foreground",
  success: "gradient-success text-success-foreground",
  warning: "gradient-warning text-warning-foreground",
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatsCardProps) {
  const isGradient = variant !== "default";
  
  return (
    <div className={cn(
      "rounded-xl p-6 transition-all duration-300 hover:shadow-lg",
      variantStyles[variant],
      !isGradient && "border border-border shadow-sm"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            isGradient ? "opacity-90" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              isGradient ? "opacity-80" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive",
              isGradient && "opacity-90"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}% vs ontem
            </p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-3",
          isGradient ? "bg-white/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            isGradient ? "text-current" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
