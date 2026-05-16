import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain, Info } from 'lucide-react';
import { useTrendPrediction } from '@/hooks/use-trend-prediction';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function TrendBadge({ trend, metric }: { trend: 'up' | 'down' | 'stable'; metric: string }) {
  const labels = { up: 'Crescente', down: 'Decrescente', stable: 'Estável' };
  const descriptions = {
    up: `A performance de ${metric} está aumentando em relação ao período anterior.`,
    down: `A performance de ${metric} está diminuindo. Considere revisar sua estratégia.`,
    stable: `A performance de ${metric} está consistente.`,
  };
  const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
    up: 'default', down: 'destructive', stable: 'secondary',
  };
  
  return (
    <TooltipWrapper content={descriptions[trend]}>
      <Badge variant={variants[trend]} className="text-xs gap-1 cursor-help">
        <TrendIcon trend={trend} />
        {labels[trend]}
      </Badge>
    </TooltipWrapper>
  );
}

function TrendPredictionTabBase() {
  const { data, isLoading, error } = useTrendPrediction();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Dados insuficientes para gerar previsões. Continue rastreando emails para habilitar esta funcionalidade.</p>
        </CardContent>
      </Card>
    );
  }

  // Merge historical + predictions for chart
  const chartData = [
    ...data.historical.map(d => ({
      date: d.date.slice(5), // MM-DD
      emails: d.emails,
      opens: d.opens,
      clicks: d.clicks,
      type: 'historical',
    })),
    ...data.predictions.map(d => ({
      date: d.date.slice(5),
      emails: d.predictedEmails,
      opens: d.predictedOpens,
      clicks: d.predictedClicks,
      type: 'prediction',
    })),
  ];

  const todayIdx = data.historical.length - 1;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Previsão de Tendências
          </CardTitle>
          <CardDescription>
            Forecast de métricas futuras baseado em análise de dados históricos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Trend Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Emails</p>
              <TrendBadge trend={data.summary.emailsTrend} metric="emails" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Aberturas</p>
              <TrendBadge trend={data.summary.opensTrend} metric="aberturas" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">Cliques</p>
              <TrendBadge trend={data.summary.clicksTrend} metric="cliques" />
            </div>
          </div>

          {/* Forecast Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground">Taxa de Abertura Prevista (7d)</p>
              <p className="text-2xl font-bold text-primary">{data.summary.predictedOpenRate.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground">Taxa de Cliques Prevista (7d)</p>
              <p className="text-2xl font-bold text-primary">{data.summary.predictedClickRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine x={chartData[todayIdx]?.date} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Hoje', fontSize: 10 }} />
                <Area type="monotone" dataKey="emails" stroke="hsl(var(--primary))" fill="url(#colorEmails)" name="Emails" />
                <Area type="monotone" dataKey="opens" stroke="#22c55e" fill="url(#colorOpens)" name="Aberturas" />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" fill="transparent" strokeDasharray="4 2" name="Cliques" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary rounded" /> Histórico
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-primary rounded border-dashed" style={{ borderTop: '2px dashed' }} /> Previsão
            </span>
          </div>

          {/* Prediction Details */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium">Previsões para os Próximos 7 Dias</h4>
              <TooltipWrapper content="Previsões geradas via regressão linear baseada nos últimos 30 dias de interações.">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipWrapper>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {data.predictions.map((p, i) => (
                <motion.div 
                  key={p.date} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-2 rounded-lg border text-center hover:bg-muted/50 transition-colors"
                >
                  <p className="text-xs text-muted-foreground">{p.date.slice(5)}</p>
                  <p className="text-sm font-bold">{p.predictedEmails}</p>
                  <p className="text-xs text-green-600">{p.predictedOpens} abr</p>
                  <TooltipWrapper content={`Grau de confiança estatística: ${p.confidence}%`}>
                    <Badge variant="outline" className="text-[10px] mt-1 cursor-help">{p.confidence}%</Badge>
                  </TooltipWrapper>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const TrendPredictionTab = memo(TrendPredictionTabBase);
export default TrendPredictionTab;
