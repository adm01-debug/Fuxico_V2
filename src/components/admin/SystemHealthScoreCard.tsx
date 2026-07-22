import { useEffect, useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HealthResult {
  score: number;
  grade: string;
  breakdown: Record<string, number>;
  computed_at: string;
}

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'bg-green-500/20 text-green-600';
  if (grade === 'B') return 'bg-blue-500/20 text-blue-600';
  if (grade === 'C') return 'bg-yellow-500/20 text-yellow-600';
  return 'bg-red-500/20 text-red-600';
}

const LABELS: Record<string, string> = {
  cron_failures_24h: 'Falhas de cron (24h)',
  critical_events_24h: 'Alertas críticos (24h)',
  bloat_alerts_24h: 'Tabelas com bloat (24h)',
  query_regressions_24h: 'Regressões de query (24h)',
  advisor_high_last_run: 'Índices críticos (advisor)',
};

function SystemHealthScoreCardBase() {
  const [data, setData] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // @ts-expect-error nova RPC ainda não presente nos types gerados
    const { data: result, error } = await supabase.rpc('admin_system_health_score');
    setLoading(false);
    if (error) {
      toast.error('Falha ao carregar health score', { description: error.message });
      return;
    }
    setData(result as HealthResult);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          System Health Score
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums">{data.score.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 10</span>
              <Badge className={gradeColor(data.grade)}>Nota {data.grade}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(data.breakdown).map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{LABELS[k] ?? k}</div>
                  <div className="text-xl font-semibold tabular-nums">{v}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado em {new Date(data.computed_at).toLocaleString('pt-BR')}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Calculando…</p>
        )}
      </CardContent>
    </Card>
  );
}

export const SystemHealthScoreCard = memo(SystemHealthScoreCardBase);
