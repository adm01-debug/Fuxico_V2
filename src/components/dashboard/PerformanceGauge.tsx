// =============================================================================
// Performance Gauge - Indicador visual de saúde do email marketing
// =============================================================================

import { useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface PerformanceGaugeProps {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate?: number;
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
    },
    {
      label: 'Taxa de Cliques',
      value: clickRate,
      target: 5,
      unit: '%',
      trend: clickRate >= 5 ? 'up' : clickRate >= 2 ? 'neutral' : 'down',
    },
    {
      label: 'Taxa de Entrega',
      value: deliveryRate,
      target: 95,
      unit: '%',
      trend: deliveryRate >= 95 ? 'up' : deliveryRate >= 90 ? 'neutral' : 'down',
    },
    {
      label: 'Taxa de Bounce',
      value: bounceRate,
      target: 2,
      unit: '%',
      trend: bounceRate <= 2 ? 'up' : bounceRate <= 5 ? 'neutral' : 'down',
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excelente', icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/30' };
    if (score >= 60) return { label: 'Bom', icon: TrendingUp, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' };
    if (score >= 40) return { label: 'Regular', icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' };
    return { label: 'Crítico', icon: XCircle, color: 'bg-red-500/10 text-red-600 border-red-500/30' };
  };

  const scoreInfo = getScoreLabel(overallScore);
  const ScoreIcon = scoreInfo.icon;

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Performance Geral</CardTitle>
          </div>
          <Badge variant="outline" className={cn('gap-1', scoreInfo.color)}>
            <ScoreIcon className="h-3 w-3" />
            {scoreInfo.label}
          </Badge>
        </div>
        <CardDescription>Indicadores de saúde do seu email marketing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-muted"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className={cn('transition-all duration-1000', getScoreColor(overallScore).replace('text-', 'stroke-'))}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
          </div>
        </div>

        {/* Métricas Individuais */}
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <div className="flex items-center gap-1.5">
                  {metric.trend && getTrendIcon(metric.trend)}
                  <span className="font-medium">
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                </div>
              </div>
              <Progress
                value={
                  metric.label === 'Taxa de Bounce'
                    ? Math.max(0, 100 - (metric.value / 10) * 100)
                    : Math.min((metric.value / metric.target) * 100, 100)
                }
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
