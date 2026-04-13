import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricCardProps } from './types';

function MiniSparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const padding = 2;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#sparklineGradient)"
      />
    </svg>
  );
}

function AnimatedNumber({ value, className }: { value: number | string; className?: string }) {
  return (
    <motion.span
      key={value.toString()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
    </motion.span>
  );
}

export function MetricCard({ 
  title, value, change, changeLabel, icon, 
  trend = 'neutral', isLoading, className = '', gradient, sparklineData,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <Card role="region" aria-label="Estatísticas" className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div role="region" aria-label="DashboardHome" className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const trendBg = trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-red-500/10' : 'bg-muted';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        role="region" 
        aria-label="Estatísticas" 
        className={cn(
          'relative overflow-hidden transition-all duration-300 card-futuristic',
          'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30',
          'dark:hover:shadow-primary/15 dark:hover:shadow-glow',
          className
        )}
      >
        <AnimatePresence>
          {isHovered && gradient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              exit={{ opacity: 0 }}
              className={cn('absolute inset-0 bg-gradient-to-br', gradient)}
            />
          )}
        </AnimatePresence>

        <CardContent className="pt-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {title}
                {sparklineData && sparklineData.length > 0 && (
                  <MiniSparkline 
                    data={sparklineData} 
                    color={trend === 'up' ? 'hsl(142, 76%, 36%)' : trend === 'down' ? 'hsl(0, 84%, 60%)' : 'hsl(var(--primary))'} 
                  />
                )}
              </p>
              <div className="mt-2">
                <AnimatedNumber value={value} className="text-2xl sm:text-3xl font-bold tracking-tight" />
              </div>
              {change !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <span className={cn('flex items-center gap-0.5 text-sm font-medium px-1.5 py-0.5 rounded-md', trendBg, trendColor)}>
                    {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                    {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                  {changeLabel && (
                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                  )}
                </motion.div>
              )}
            </div>
            
            <motion.div 
              animate={{ 
                rotate: isHovered ? [0, -5, 5, 0] : 0,
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0",
                gradient ? `bg-gradient-to-br ${gradient} text-white` : 'bg-primary/10'
              )}
            >
              {icon}
            </motion.div>
          </div>
        </CardContent>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 origin-left',
            gradient ? `bg-gradient-to-r ${gradient}` : 'bg-primary'
          )}
        />
      </Card>
    </motion.div>
  );
}
