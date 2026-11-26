import { memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, AlertTriangle, CheckCircle2, Database, Lock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { adminRpc } from '@/lib/admin-rpc';
import { cn } from '@/lib/utils';
import { matchFirst } from '@/lib/variant';

interface DbHealthCheck {
  status: 'healthy' | 'degraded';
  checked_at: string;
  checks: {
    connections_ok: boolean;
    mv_freshness_ok: boolean;
    mv_age_seconds: number | null;
    default_partitions_empty: boolean;
    blocked_locks: number;
  };
}

interface IntegrityRow {
  check_name: string;
  violations: number;
  severity: string;
}

interface BlockingRow {
  blocked_pid: number;
  blocked_user: string | null;
  blocked_query: string | null;
  blocking_pid: number;
  blocking_user: string | null;
  blocking_query: string | null;
  waited_seconds: number | null;
}

function fmtAge(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return '—';
  const s = Math.max(0, Math.round(seconds));
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  if (s < 172800) return `${(s / 3600).toFixed(1)} h`;
  return `${(s / 86400).toFixed(1)} dias`;
}

function sevCls(severity: string) {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high')
    return 'bg-destructive/15 text-destructive border-destructive/30';
  if (s === 'medium' || s === 'warning')
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  return 'bg-muted text-muted-foreground';
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="font-mono text-xs text-muted-foreground">{detail}</span>}
        <Badge
          variant="outline"
          className={
            ok
              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'border-destructive/30 text-destructive'
          }
        >
          {ok ? 'OK' : 'ATENÇÃO'}
        </Badge>
      </div>
    </div>
  );
}

function DatabaseMaintenancePanelBase() {
  const qc = useQueryClient();

  const health = useQuery({
    queryKey: ['db_health_check'],
    queryFn: () => adminRpc<DbHealthCheck>('db_health_check'),
    staleTime: 30_000,
  });

  const integrity = useQuery({
    queryKey: ['admin_data_integrity_check'],
    queryFn: () => adminRpc<IntegrityRow[]>('admin_data_integrity_check'),
    staleTime: 60_000,
  });

  const locks = useQuery({
    queryKey: ['admin_blocking_queries'],
    queryFn: () => adminRpc<BlockingRow[]>('admin_blocking_queries'),
    staleTime: 15_000,
  });

  const resetStats = useMutation({
    mutationFn: () => adminRpc<void>('reset_slow_query_stats'),
    onSuccess: () => {
      toast.success(
        'Estatísticas de queries zeradas — as regressões serão recalculadas a partir de agora.'
      );
      qc.invalidateQueries({ queryKey: ['db_health_check'] });
      qc.invalidateQueries({ queryKey: ['admin_query_regressions'] });
    },
    onError: (e: unknown) =>
      toast.error(
        `Falha ao resetar estatísticas: ${e instanceof Error ? e.message : 'erro desconhecido'}`
      ),
  });

  const h = health.data;
  const checks = h?.checks;
  const integrityRows = integrity.data ?? [];
  const violations = integrityRows.reduce((acc, r) => acc + Number(r.violations ?? 0), 0);
  const failingSeverities = integrityRows.reduce(
    (acc, r) => (Number(r.violations) > 0 ? [...acc, r.severity] : acc),
    [] as string[]
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Saúde do banco
            </CardTitle>
            <CardDescription>
              Sonda rápida (timeout 2s) de conexões, frescor das matviews, partições default e locks
              bloqueantes. <code>db_health_check</code>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="sm"
              variant="outline"
              onClick={() => health.refetch()}
              disabled={health.isFetching}
            >
              <Activity className={cn('mr-2 h-4 w-4', health.isFetching && 'animate-pulse')} />
              {health.isFetching ? 'Verificando...' : 'Verificar agora'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={resetStats.isPending}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {resetStats.isPending ? 'Zerando...' : 'Zerar estatísticas de queries'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Zerar estatísticas de queries</AlertDialogTitle>
                  <AlertDialogDescription>
                    Executa <code>pg_stat_statements_reset()</code>. Todo o histórico de tempo por
                    query é apagado — enquanto as estatísticas novas não acumularem, a comparação de
                    regressões aparece vazia. Use quando os números estiverem distorcidos por um
                    incidente já resolvido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => resetStats.mutate()}>
                    Zerar agora
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {matchFirst(
            [
              [
                health.isError,
                () => (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Erro ao sondar o banco:{' '}
                    {health.error instanceof Error ? health.error.message : 'erro desconhecido'}
                  </div>
                ),
              ],
              [health.isLoading || !checks, () => <Skeleton className="h-32 w-full" />],
            ],
            () => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      h?.status === 'healthy'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }
                  >
                    {h?.status === 'healthy' ? 'SAUDÁVEL' : 'DEGRADADO'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Verificado em {h ? new Date(h.checked_at).toLocaleString('pt-BR') : '—'}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <CheckRow ok={!!checks?.connections_ok} label="Conexões do banco" />
                  <CheckRow
                    ok={!!checks?.mv_freshness_ok}
                    label="Frescor de email_stats_mv"
                    detail={fmtAge(checks?.mv_age_seconds ?? null)}
                  />
                  <CheckRow
                    ok={!!checks?.default_partitions_empty}
                    label="Partições default vazias"
                  />
                  <CheckRow
                    ok={(checks?.blocked_locks ?? 0) === 0}
                    label="Locks bloqueantes"
                    detail={String(checks?.blocked_locks ?? 0)}
                  />
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Integridade de dados
          </CardTitle>
          <CardDescription>
            Checagens de órfãos e vínculos inválidos em toda a base.{' '}
            <code>admin_data_integrity_check</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {matchFirst(
            [
              [
                integrity.isError,
                () => (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Erro ao checar integridade:{' '}
                    {integrity.error instanceof Error
                      ? integrity.error.message
                      : 'erro desconhecido'}
                  </div>
                ),
              ],
              [integrity.isLoading, () => <Skeleton className="h-40 w-full" />],
              [
                integrityRows.length === 0,
                () => (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhuma checagem registrada.
                  </div>
                ),
              ],
            ],
            () => (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={
                      violations === 0
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/30 text-destructive'
                    }
                  >
                    {violations === 0 ? 'Sem violações' : `${violations} violações`}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {integrityRows.length} checagens executadas
                  </span>
                  {failingSeverities.slice(0, 3).map((s, i) => (
                    <Badge key={`${s}-${i}`} variant="outline" className={sevCls(s)}>
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Checagem</TableHead>
                        <TableHead className="text-right">Violações</TableHead>
                        <TableHead>Severidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...integrityRows]
                        .sort((a, b) => Number(b.violations) - Number(a.violations))
                        .map((r) => (
                          <TableRow key={r.check_name}>
                            <TableCell className="font-mono text-xs">{r.check_name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {Number(r.violations) === 0 ? (
                                <span className="text-muted-foreground">0</span>
                              ) : (
                                <span className="font-semibold text-destructive">
                                  {r.violations}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn('text-xs', sevCls(r.severity))}
                              >
                                {r.severity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" /> Queries bloqueadas
          </CardTitle>
          <CardDescription>
            Sessões esperando lock agora. Lista vazia = nenhum bloqueio.{' '}
            <code>admin_blocking_queries</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matchFirst(
            [
              [
                locks.isError,
                () => (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Erro ao listar bloqueios:{' '}
                    {locks.error instanceof Error ? locks.error.message : 'erro desconhecido'}
                  </div>
                ),
              ],
              [locks.isLoading, () => <Skeleton className="h-24 w-full" />],
              [
                (locks.data ?? []).length === 0,
                () => (
                  <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Nenhuma query bloqueada neste momento.
                  </div>
                ),
              ],
            ],
            () => (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">PID bloq.</TableHead>
                      <TableHead>Esperando há</TableHead>
                      <TableHead>Query bloqueada</TableHead>
                      <TableHead className="text-right">PID bloqueador</TableHead>
                      <TableHead>Query bloqueadora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(locks.data ?? []).map((r) => (
                      <TableRow key={`${r.blocked_pid}-${r.blocking_pid}`}>
                        <TableCell className="text-right font-mono text-xs">
                          {r.blocked_pid}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {r.waited_seconds === null ? '—' : `${r.waited_seconds}s`}
                        </TableCell>
                        <TableCell
                          className="max-w-sm truncate font-mono text-xs"
                          title={r.blocked_query ?? undefined}
                        >
                          {r.blocked_query ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {r.blocking_pid}
                        </TableCell>
                        <TableCell
                          className="max-w-sm truncate font-mono text-xs"
                          title={r.blocking_query ?? undefined}
                        >
                          {r.blocking_query ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </>
  );
}

export const DatabaseMaintenancePanel = memo(DatabaseMaintenancePanelBase);
