import { memo, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAIInsights,
  useRefreshInsights,
  type Insight,
  type InsightPeriod,
} from '@/hooks/use-ai-insights';

const PERIODS: Array<{ value: InsightPeriod; label: string }> = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'all', label: 'Tudo' },
];

const TYPE_STYLES: Record<
  Insight['type'],
  { card: string; icon: typeof Info; iconClass: string; label: string; badge: string }
> = {
  warning: {
    card: 'border-amber-500/40 bg-amber-500/5',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    label: 'Atenção',
    badge: 'border-amber-500/40 text-amber-700',
  },
  info: {
    card: 'border-sky-500/40 bg-sky-500/5',
    icon: Info,
    iconClass: 'text-sky-600',
    label: 'Observação',
    badge: 'border-sky-500/40 text-sky-700',
  },
  success: {
    card: 'border-emerald-500/40 bg-emerald-500/5',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    label: 'Ponto forte',
    badge: 'border-emerald-500/40 text-emerald-700',
  },
};

const TYPE_ORDER: Record<Insight['type'], number> = { warning: 0, info: 1, success: 2 };

function formatMetric(metric: number) {
  if (!Number.isFinite(metric)) return String(metric);
  return metric.toLocaleString('pt-BR', {
    maximumFractionDigits: Number.isInteger(metric) ? 0 : 2,
  });
}

function InsightsTabBase() {
  const [period, setPeriod] = useState<InsightPeriod>('30d');
  const { data, isLoading, isError, error, dataUpdatedAt } = useAIInsights(period);
  const refresh = useRefreshInsights();

  const insights = useMemo(
    () => [...(data?.insights ?? [])].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]),
    [data?.insights]
  );

  const counts = useMemo(() => {
    return insights.reduce(
      (acc, insight) => {
        acc[insight.type] += 1;
        return acc;
      },
      { warning: 0, info: 0, success: 0 } as Record<Insight['type'], number>
    );
  }, [insights]);

  const handleRefresh = () => refresh.mutate(period);

  const updatedLabel = dataUpdatedAt
    ? `Atualizado ${formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: ptBR })}`
    : null;

  return (
    <div role="region" aria-label="InsightsTab" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insights IA</h2>
          <p className="text-muted-foreground">
            Análise automática do desempenho dos seus e-mails rastreados
            {updatedLabel ? ` · ${updatedLabel}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Período da análise" className="flex gap-1">
            {PERIODS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={period === option.value ? 'default' : 'outline'}
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                disabled={refresh.isPending}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={handleRefresh} disabled={refresh.isPending || isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Carregando insights">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Não foi possível gerar a análise
            </CardTitle>
            <CardDescription>
              {error instanceof Error && error.message
                ? error.message
                : 'Tente novamente em alguns instantes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refresh.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : insights.length === 0 ? (
        <EmptyState
          type="insights"
          title="Ainda não há dados suficientes"
          description={`Nenhum insight para o período de ${PERIODS.find((p) => p.value === period)?.label.toLowerCase()}. Envie e-mails rastreados e atualize a análise.`}
          actionLabel="Atualizar análise"
          onAction={handleRefresh}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{insights.length} insights</Badge>
            {counts.warning > 0 && (
              <Badge variant="outline" className={TYPE_STYLES.warning.badge}>
                {counts.warning} atenção
              </Badge>
            )}
            {counts.success > 0 && (
              <Badge variant="outline" className={TYPE_STYLES.success.badge}>
                {counts.success} ponto forte
              </Badge>
            )}
            {counts.info > 0 && (
              <Badge variant="outline" className={TYPE_STYLES.info.badge}>
                {counts.info} observação
              </Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => {
              const style = TYPE_STYLES[insight.type] ?? TYPE_STYLES.info;
              const Icon = style.icon;

              return (
                <Card key={`${insight.title}-${index}`} className={style.card}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex items-start gap-2 text-base">
                        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
                        <span>{insight.title}</span>
                      </CardTitle>
                      <Badge variant="outline" className={style.badge}>
                        {style.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {typeof insight.metric === 'number' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{formatMetric(insight.metric)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {refresh.isError && (
        <p role="alert" className="text-sm text-destructive">
          Falha ao atualizar a análise:{' '}
          {refresh.error instanceof Error && refresh.error.message
            ? refresh.error.message
            : 'erro desconhecido'}
        </p>
      )}
    </div>
  );
}

export const InsightsTab = memo(InsightsTabBase);
