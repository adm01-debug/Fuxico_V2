// =============================================================================
// FUXICO - Performance Gauge Premium Component
// Indicador visual de saúde do email marketing com animações
// Versão: 2.0 - Premium Design
// =============================================================================

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Target,
  Zap,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  color: string;
  gradient: string;
}

interface PerformanceGaugeProps {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate?: number;
}

// Animated circular gauge component
function AnimatedGauge({ 
  score, 
  size = 160, 
  strokeWidth = 14 
}: { 
  score: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    if (s >= 60) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
    if (s >= 40) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };

  const colors = getScoreColor(animatedScore);
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <motion.div
        animate={{ 
          boxShadow: `0 0 40px ${colors.glow}`,
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-4 rounded-full"
      />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="stroke-muted"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-4xl font-bold"
          style={{ color: colors.stroke }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-1">de 100</span>
      </div>

      {/* Decorative particles */}
      {animatedScore >= 80 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        </motion.div>
      )}
    </div>
  );
}

// Animated metric bar
function MetricBar({ 
  metric, 
  index 
}: { 
  metric: PerformanceMetric; 
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const progressValue = metric.label === 'Taxa de Bounce'
    ? Math.max(0, 100 - (metric.value / 10) * 100)
    : Math.min((metric.value / metric.target) * 100, 100);

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div className={cn(
        'p-3 rounded-xl border transition-all duration-300',
        isHovered ? 'bg-muted/50 border-primary/20 shadow-sm' : 'border-transparent'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1 }}
              className={cn(
                'h-6 w-6 rounded-lg flex items-center justify-center',
                `bg-gradient-to-br ${metric.gradient}`
              )}
            >
              <Target className="h-3 w-3 text-white" />
            </motion.div>
            <span className="text-sm font-medium text-foreground">{metric.label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{metric.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta: {metric.target}{metric.unit}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            {metric.trend && getTrendIcon(metric.trend)}
            <span className={cn('font-bold', metric.color)}>
              {metric.value.toFixed(1)}{metric.unit}
            </span>
          </div>
        </div>

        {/* Progress bar with animation */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              `bg-gradient-to-r ${metric.gradient}`
            )}
          />
          {/* Target indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.5 }}
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
            style={{ left: '100%', transform: 'translateX(-100%)' }}
          />
        </div>

        {/* Achievement badge */}
        <AnimatePresence>
          {progressValue >= 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-1 -right-1"
            >
              <Badge className="h-5 px-1.5 text-[10px] bg-gradient-to-r from-emerald-500 to-green-500 border-0">
                <CheckCircle className="h-3 w-3 mr-0.5" />
                Meta
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function PerformanceGauge({
  openRate,
  clickRate,
  bounceRate,
  deliveryRate = 100 - bounceRate,
}: PerformanceGaugeProps) {
  const metrics: PerformanceMetric[] = useMemo(() => [
    {
      label: 'Taxa de Abertura',
      value: openRate,
      target: 25,
      unit: '%',
      trend: openRate >= 25 ? 'up' : openRate >= 15 ? 'neutral' : 'down',
      description: 'Porcentagem de emails abertos pelos destinatários',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Taxa de Cliques',
      value: clickRate,
      target: 5,
      unit: '%',
      trend: clickRate >= 5 ? 'up' : clickRate >= 2 ? 'neutral' : 'down',
      description: 'Porcentagem de cliques em links dos emails',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Taxa de Entrega',
      value: deliveryRate,
      target: 95,
      unit: '%',
      trend: deliveryRate >= 95 ? 'up' : deliveryRate >= 90 ? 'neutral' : 'down',
      description: 'Porcentagem de emails entregues com sucesso',
      color: 'text-violet-600',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Taxa de Bounce',
      value: bounceRate,
      target: 2,
      unit: '%',
      trend: bounceRate <= 2 ? 'up' : bounceRate <= 5 ? 'neutral' : 'down',
      description: 'Porcentagem de emails que retornaram (menor é melhor)',
      color: bounceRate <= 2 ? 'text-emerald-600' : bounceRate <= 5 ? 'text-amber-600' : 'text-red-600',
      gradient: bounceRate <= 2 ? 'from-emerald-500 to-green-500' : bounceRate <= 5 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500',
    },
  ], [openRate, clickRate, bounceRate, deliveryRate]);

  // Calcular score geral (0-100)
  const overallScore = useMemo(() => {
    const openScore = Math.min((openRate / 25) * 25, 25);
    const clickScore = Math.min((clickRate / 5) * 25, 25);
    const deliveryScore = Math.min((deliveryRate / 95) * 25, 25);
    const bounceScore = bounceRate <= 2 ? 25 : bounceRate <= 5 ? 15 : 5;
    return Math.round(openScore + clickScore + deliveryScore + bounceScore);
  }, [openRate, clickRate, deliveryRate, bounceRate]);

  const getScoreInfo = (score: number) => {
    if (score >= 80) return { 
      label: 'Excelente', 
      icon: CheckCircle, 
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      gradient: 'from-emerald-500 to-green-500',
      description: 'Suas métricas estão acima da média!'
    };
    if (score >= 60) return { 
      label: 'Bom', 
      icon: TrendingUp, 
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      gradient: 'from-amber-500 to-yellow-500',
      description: 'Bom desempenho, continue assim!'
    };
    if (score >= 40) return { 
      label: 'Regular', 
      icon: AlertTriangle, 
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      gradient: 'from-orange-500 to-amber-500',
      description: 'Há espaço para melhorias'
    };
    return { 
      label: 'Crítico', 
      icon: XCircle, 
      color: 'bg-red-500/10 text-red-600 border-red-500/30',
      gradient: 'from-red-500 to-rose-500',
      description: 'Atenção necessária nas métricas'
    };
  };

  const scoreInfo = getScoreInfo(overallScore);
  const ScoreIcon = scoreInfo.icon;

  return (
    <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Gauge className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">Performance Geral</CardTitle>
              <CardDescription>Saúde do seu email marketing</CardDescription>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Badge 
              variant="outline" 
              className={cn('gap-1.5 px-3 py-1', scoreInfo.color)}
            >
              <ScoreIcon className="h-3.5 w-3.5" />
              {scoreInfo.label}
            </Badge>
          </motion.div>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Principal com Gauge Animado */}
        <div className="flex flex-col items-center justify-center py-4">
          <AnimatedGauge score={overallScore} />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-muted-foreground mt-4 text-center"
          >
            {scoreInfo.description}
          </motion.p>
        </div>

        {/* Métricas Individuais */}
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <MetricBar key={metric.label} metric={metric} index={index} />
          ))}
        </div>

        {/* Tips */}
        {overallScore < 80 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/10"
          >
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary">Dica de Melhoria</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {openRate < 20 
                    ? 'Melhore seus assuntos para aumentar a taxa de abertura.'
                    : clickRate < 3
                    ? 'Adicione CTAs mais claros para aumentar os cliques.'
                    : bounceRate > 3
                    ? 'Limpe sua lista para reduzir a taxa de bounce.'
                    : 'Continue otimizando suas campanhas!'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
