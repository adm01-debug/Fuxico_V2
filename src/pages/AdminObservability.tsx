import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminRpc } from '@/lib/admin-rpc';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Database, Clock, AlertTriangle, Gauge, RefreshCw, Server, TrendingDown, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { IndexUsageDashboard } from '@/components/admin/IndexUsageDashboard';

type Severity = 'ok' | 'warning' | 'critical';

function sevBadge(sev: Severity) {
  const map: Record<Severity, string> = {
    ok: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    critical: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return <Badge variant="outline" className={map[sev]}>{sev.toUpperCase()}</Badge>;
}

export default function AdminObservability() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!checkingAdmin && isAdmin === false) {
      toast.error('Acesso restrito a administradores');
      navigate('/dashboard');
    }
  }, [isAdmin, checkingAdmin, navigate]);

  const opsDashboard = useQuery({
    queryKey: ['admin_ops_dashboard', refreshKey],
    queryFn: () => adminRpc<any>('admin_ops_dashboard'),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const cronStatus = useQuery({
    queryKey: ['admin_cron_status', refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_cron_status' as any).select('*');
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const bloat = useQuery({
    queryKey: ['admin_table_bloat', refreshKey],
    queryFn: () => adminRpc<any[]>('admin_table_bloat'),
    enabled: !!isAdmin,
    staleTime: 60_000,
  });

  const regressions = useQuery({
    queryKey: ['admin_query_regressions', refreshKey],
    queryFn: () => adminRpc<any[]>('admin_query_regressions', { _threshold_pct: 50 }),
    enabled: !!isAdmin,
    staleTime: 60_000,
  });

  const dlq = useQuery({
    queryKey: ['admin_list_cron_failures', refreshKey],
    queryFn: () => adminRpc<any[]>('admin_list_cron_failures', { _limit: 50 }),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const sanity = useQuery({
    queryKey: ['admin_alert_sanity_check', refreshKey],
    queryFn: () => adminRpc<any>('admin_alert_sanity_check'),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const handleReplay = async (id: string) => {
    try {
      await adminRpc('admin_replay_cron_failure', { _failure_id: id });
      toast.success('Falha reenfileirada para reprocessamento');
      dlq.refetch();
    } catch (e) {
      toast.error(`Falha ao reprocessar: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  if (checkingAdmin || !isAdmin) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const ops = opsDashboard.data;
  const conn = ops?.connections;
  const strag = ops?.default_partition_stragglers;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => navigate('/dashboard')} />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Observabilidade
            </h1>
            <p className="text-sm text-muted-foreground">
              Painel unificado de saúde do banco, cron jobs e performance de queries.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="w-4 h-4" /> Tamanho do banco
            </CardDescription>
            <CardTitle className="text-2xl">
              {opsDashboard.isLoading ? <Skeleton className="h-8 w-24" /> : ops?.database?.total_size ?? '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Server className="w-4 h-4" /> Conexões ativas
            </CardDescription>
            <CardTitle className="text-2xl">
              {opsDashboard.isLoading ? <Skeleton className="h-8 w-16" /> : `${conn?.active ?? 0}/${conn?.total ?? 0}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            idle: {conn?.idle ?? 0} · idle_in_tx: {conn?.idle_in_tx ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Cron jobs (fuxico-*)
            </CardDescription>
            <CardTitle className="text-2xl">
              {cronStatus.isLoading ? <Skeleton className="h-8 w-16" /> : cronStatus.data?.length ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            falhas recentes: {cronStatus.data?.filter((c: any) => c.last_status && c.last_status !== 'succeeded').length ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Regressões (24h, ≥50%)
            </CardDescription>
            <CardTitle className="text-2xl">
              {regressions.isLoading ? <Skeleton className="h-8 w-16" /> : regressions.data?.length ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sanity Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Sanity Check (24h)
          </CardTitle>
          <CardDescription>
            Saúde consolidada de alertas, fila DLQ e envios agendados travados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sanity.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Alertas enviados', value: sanity.data?.alerts_last_24h?.sent ?? 0, ok: 0 },
                { label: 'Alertas pulados', value: sanity.data?.alerts_last_24h?.skipped ?? 0, ok: 0 },
                { label: 'Alertas falharam', value: sanity.data?.alerts_last_24h?.failed ?? 0, ok: 0 },
                { label: 'DLQ pendente', value: sanity.data?.cron_dlq_pending ?? 0, ok: 0 },
                { label: 'Envios travados', value: sanity.data?.stuck_scheduled_emails ?? 0, ok: 0 },
              ].map((m) => {
                const n = Number(m.value);
                const sev: Severity =
                  m.label === 'Alertas enviados'
                    ? 'ok'
                    : n === 0
                    ? 'ok'
                    : n < 5
                    ? 'warning'
                    : 'critical';
                return (
                  <div key={m.label} className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xl font-semibold">{n}</span>
                      {sevBadge(sev)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cron Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Cron Jobs
          </CardTitle>
          <CardDescription>Status consolidado de todos os jobs fuxico-*</CardDescription>
        </CardHeader>
        <CardContent>
          {cronStatus.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Último status</TableHead>
                    <TableHead>Última execução</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cronStatus.data ?? []).map((job: any) => {
                    const sev: Severity =
                      !job.active ? 'critical'
                        : job.last_status === 'failed' ? 'critical'
                        : job.last_status === 'succeeded' ? 'ok'
                        : 'warning';
                    return (
                      <TableRow key={job.jobname}>
                        <TableCell className="font-mono text-xs">{job.jobname}</TableCell>
                        <TableCell className="font-mono text-xs">{job.schedule}</TableCell>
                        <TableCell>{job.active ? '✅' : '❌'}</TableCell>
                        <TableCell>{sevBadge(sev)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.last_run_at ? new Date(job.last_run_at).toLocaleString('pt-BR') : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(cronStatus.data ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum job encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Regressions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" /> Regressões de Queries
          </CardTitle>
          <CardDescription>
            Queries cujo tempo médio piorou ≥ 50% nas últimas 24h comparado à baseline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regressions.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (regressions.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              ✨ Nenhuma regressão detectada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Atual (ms)</TableHead>
                    <TableHead className="text-right">Baseline (ms)</TableHead>
                    <TableHead className="text-right">Δ %</TableHead>
                    <TableHead className="text-right">Chamadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(regressions.data ?? []).map((r: any) => (
                    <TableRow key={r.queryid}>
                      <TableCell className="max-w-md truncate font-mono text-xs">{r.query_text}</TableCell>
                      <TableCell className="text-right">{r.current_mean_ms}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.baseline_mean_ms}</TableCell>
                      <TableCell className="text-right">
                        {sevBadge(r.regression_pct >= 200 ? 'critical' : 'warning')}
                        <span className="ml-2 font-semibold">+{r.regression_pct}%</span>
                      </TableCell>
                      <TableCell className="text-right">{r.current_calls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Bloat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" /> Bloat de Tabelas
          </CardTitle>
          <CardDescription>Top 50 tabelas com maior número de dead tuples.</CardDescription>
        </CardHeader>
        <CardContent>
          {bloat.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabela</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Bloat</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-right">Live</TableHead>
                    <TableHead className="text-right">Dead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bloat.data ?? []).slice(0, 15).map((t: any) => (
                    <TableRow key={t.table_name}>
                      <TableCell className="font-mono text-xs">{t.table_name}</TableCell>
                      <TableCell className="text-right">{t.total_size}</TableCell>
                      <TableCell className="text-right">{t.bloat_size}</TableCell>
                      <TableCell className="text-right">
                        {sevBadge(t.bloat_ratio_pct >= 30 ? 'critical' : t.bloat_ratio_pct >= 15 ? 'warning' : 'ok')}
                        <span className="ml-2">{t.bloat_ratio_pct}%</span>
                      </TableCell>
                      <TableCell className="text-right">{t.live_rows}</TableCell>
                      <TableCell className="text-right">{t.dead_rows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partition Stragglers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Partições Default (stragglers)
          </CardTitle>
          <CardDescription>Linhas que caíram na partição default (deveriam ser 0).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {strag && Object.entries(strag).map(([k, v]) => {
              const n = Number(v ?? 0);
              const sev: Severity = n === 0 ? 'ok' : n < 100 ? 'warning' : 'critical';
              return (
                <div key={k} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-xs font-mono">{k}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{n}</span>
                    {sevBadge(sev)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dead Letter Queue — Falhas de cron */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Dead Letter Queue (cron)
          </CardTitle>
          <CardDescription>
            Falhas de execução HTTP dos cron jobs. Use "Reprocessar" para reenfileirar manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dlq.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !dlq.data || dlq.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma falha registrada. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dlq.data.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.job_name}</TableCell>
                      <TableCell>
                        <Badge variant={f.status_code && f.status_code < 500 ? 'secondary' : 'destructive'}>
                          {f.status_code ?? 'ERR'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{f.attempts}</TableCell>
                      <TableCell className="max-w-md truncate text-xs" title={f.error_message}>
                        {f.error_message ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(f.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!f.replayed_at}
                          onClick={() => handleReplay(f.id)}
                        >
                          {f.replayed_at ? 'Reprocessado' : 'Reprocessar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard de uso de índices */}
      <IndexUsageDashboard />
    </div>
  );
}
