import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  FileWarning,
  KeyRound,
  MinusCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminRpc } from '@/lib/admin-rpc';
import { cn } from '@/lib/utils';
import { matchFirst, pickFirst } from '@/lib/variant';

interface PoolStats {
  active: number;
  idle: number;
  total: number;
  waiting: number;
  max_connections: number;
  utilization_pct: number;
}

interface SigningKeyStatus {
  last_rotation: string | null;
  age_days: number | null;
  needs_rotation: boolean;
}

interface SchemaDrift {
  status?: string;
  added_columns?: unknown[] | null;
  removed_columns?: unknown[] | null;
  removed_indexes?: unknown[] | null;
  removed_policies?: unknown[] | null;
}

interface OrphanPiiRow {
  source_table: string;
  orphan_count: number | string;
}

interface OrphanReport {
  total?: number;
  high?: number;
  ran_at?: string;
  breakdown?: Record<string, number>;
}

interface StaleArchive {
  archive_id: string;
  partition_name: string;
  archived_at: string;
  age_hours: number | string;
}

const AMBER = 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
const GREEN = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
const RED = 'border-destructive/30 bg-destructive/10 text-destructive';

function ErrorBox({ label, error }: { label: string; error: unknown }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4" />
      {label}: {error instanceof Error ? error.message : 'erro desconhecido'}
    </div>
  );
}

function QueryBody({
  query,
  label,
  children,
}: {
  query: { isError: boolean; error: unknown; isLoading: boolean };
  label: string;
  children: () => ReactNode;
}) {
  return matchFirst<ReactNode>(
    [
      [query.isError, () => <ErrorBox label={label} error={query.error} />],
      [query.isLoading, () => <Skeleton className="h-24 w-full" />],
    ],
    children
  );
}

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function fmtWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

function driftCount(drift: SchemaDrift | undefined): number {
  if (!drift) return 0;
  return (
    (drift.added_columns?.length ?? 0) +
    (drift.removed_columns?.length ?? 0) +
    (drift.removed_indexes?.length ?? 0) +
    (drift.removed_policies?.length ?? 0)
  );
}

export function SecurityPosturePanel() {
  const qc = useQueryClient();

  const pool = useQuery({
    queryKey: ['admin_pool_stats'],
    queryFn: () => adminRpc<PoolStats>('admin_pool_stats'),
    staleTime: 30_000,
  });

  const signing = useQuery({
    queryKey: ['admin_signing_key_status'],
    queryFn: () => adminRpc<SigningKeyStatus>('admin_signing_key_status'),
    staleTime: 300_000,
  });

  const drift = useQuery({
    queryKey: ['admin_detect_schema_drift'],
    queryFn: () => adminRpc<SchemaDrift>('admin_detect_schema_drift'),
    staleTime: 300_000,
  });

  const orphans = useQuery({
    queryKey: ['admin_find_orphan_pii'],
    queryFn: () => adminRpc<OrphanPiiRow[]>('admin_find_orphan_pii'),
    staleTime: 120_000,
  });

  const archives = useQuery({
    queryKey: ['admin_stale_archive_verifications'],
    queryFn: () => adminRpc<StaleArchive[]>('admin_stale_archive_verifications'),
    staleTime: 120_000,
  });

  const report = useMutation({
    mutationFn: () => adminRpc<OrphanReport>('admin_report_orphan_pii'),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin_find_orphan_pii'] });
      toast.success(
        `Evento LGPD registrado: ${data?.total ?? 0} registro(s) órfão(s) reportado(s)`
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Falha ao registrar o evento LGPD');
    },
  });

  const orphanRows = orphans.data ?? [];
  const orphanTotal = orphanRows.reduce((acc, r) => acc + num(r.orphan_count), 0);
  const poolData = pool.data;
  const driftData = drift.data;
  const driftTotal = driftCount(driftData);
  const baselineOnly = driftData?.status === 'baseline_only';
  const signingData = signing.data;
  const archiveRows = archives.data ?? [];

  return (
    <>
      {/* PII orfa (LGPD) */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-primary" /> PII órfã (LGPD)
              </CardTitle>
              <CardDescription>
                Registros de dados pessoais sem usuário correspondente em <code>auth.users</code>.{' '}
                <code>admin_find_orphan_pii</code> / <code>admin_report_orphan_pii</code>
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={report.isPending || orphanTotal === 0}
              onClick={() => report.mutate()}
            >
              <ShieldAlert className="mr-1 h-4 w-4" />
              {report.isPending ? 'Registrando...' : 'Registrar evento LGPD'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <QueryBody query={orphans} label="Erro ao procurar PII órfã">
            {() =>
              matchFirst<ReactNode>(
                [
                  [
                    orphanTotal === 0,
                    () => (
                      <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Nenhum registro órfão encontrado.
                      </div>
                    ),
                  ],
                ],
                () => (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tabela de origem</TableHead>
                          <TableHead className="text-right">Registros órfãos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orphanRows.map((r) => (
                          <TableRow key={r.source_table}>
                            <TableCell className="font-mono text-xs">{r.source_table}</TableCell>
                            <TableCell
                              className={cn(
                                'text-right font-mono text-xs',
                                num(r.orphan_count) > 0 && 'text-destructive'
                              )}
                            >
                              {num(r.orphan_count)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )
            }
          </QueryBody>
          {report.data && (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Último evento registrado em {fmtWhen(report.data.ran_at ?? null)} · total{' '}
              <span className="font-mono">{report.data.total ?? 0}</span> · críticos{' '}
              <span className="font-mono">{report.data.high ?? 0}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drift de schema */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Drift de schema
              </CardTitle>
              <CardDescription>
                Compara os dois últimos snapshots de schema (colunas, índices, policies).{' '}
                <code>admin_detect_schema_drift</code>
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={drift.isFetching}
              onClick={() => drift.refetch()}
            >
              <RefreshCw className={cn('mr-1 h-4 w-4', drift.isFetching && 'animate-spin')} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <QueryBody query={drift} label="Erro ao comparar snapshots">
            {() =>
              matchFirst<ReactNode>(
                [
                  [
                    baselineOnly,
                    () => (
                      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        Só existe um snapshot de schema: não há com o que comparar ainda.
                      </div>
                    ),
                  ],
                  [
                    driftTotal === 0,
                    () => (
                      <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Nenhuma alteração entre os dois últimos snapshots.
                      </div>
                    ),
                  ],
                ],
                () => (
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Colunas adicionadas</span>
                      <Badge variant="outline" className={AMBER}>
                        {driftData?.added_columns?.length ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Colunas removidas</span>
                      <Badge variant="outline" className={RED}>
                        {driftData?.removed_columns?.length ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Índices removidos</span>
                      <Badge variant="outline" className={RED}>
                        {driftData?.removed_indexes?.length ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Policies removidas</span>
                      <Badge variant="outline" className={RED}>
                        {driftData?.removed_policies?.length ?? 0}
                      </Badge>
                    </div>
                  </div>
                )
              )
            }
          </QueryBody>
        </CardContent>
      </Card>

      {/* Pool de conexoes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Pool de conexões
          </CardTitle>
          <CardDescription>
            Uso atual das conexões do Postgres. Acima de 80% o app começa a enfileirar requests.{' '}
            <code>admin_pool_stats</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <QueryBody query={pool} label="Erro ao ler o pool">
            {() => (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={matchFirst(
                      [
                        [(poolData?.utilization_pct ?? 0) >= 80, () => RED],
                        [(poolData?.utilization_pct ?? 0) >= 60, () => AMBER],
                      ],
                      () => GREEN
                    )}
                  >
                    {poolData?.utilization_pct ?? 0}% em uso
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {poolData?.total ?? 0} de {poolData?.max_connections ?? 0} conexões
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      pickFirst(
                        [
                          [(poolData?.utilization_pct ?? 0) >= 80, 'bg-destructive'],
                          [(poolData?.utilization_pct ?? 0) >= 60, 'bg-amber-500'],
                        ],
                        'bg-emerald-500'
                      )
                    )}
                    style={{ width: `${Math.min(100, poolData?.utilization_pct ?? 0)}%` }}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-md border p-2 text-center">
                    <div className="font-mono text-lg">{poolData?.active ?? 0}</div>
                    <div className="text-xs text-muted-foreground">ativas</div>
                  </div>
                  <div className="rounded-md border p-2 text-center">
                    <div className="font-mono text-lg">{poolData?.idle ?? 0}</div>
                    <div className="text-xs text-muted-foreground">ociosas</div>
                  </div>
                  <div className="rounded-md border p-2 text-center">
                    <div className="font-mono text-lg">{poolData?.waiting ?? 0}</div>
                    <div className="text-xs text-muted-foreground">em espera</div>
                  </div>
                  <div className="rounded-md border p-2 text-center">
                    <div className="font-mono text-lg">{poolData?.max_connections ?? 0}</div>
                    <div className="text-xs text-muted-foreground">limite</div>
                  </div>
                </div>
              </div>
            )}
          </QueryBody>
        </CardContent>
      </Card>

      {/* Chave de assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Chave de assinatura JWKS
          </CardTitle>
          <CardDescription>
            Idade da chave que assina os tokens de sessão. <code>admin_signing_key_status</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <QueryBody query={signing} label="Erro ao consultar a chave">
            {() =>
              matchFirst<ReactNode>(
                [
                  [
                    signingData?.last_rotation === null || signingData?.last_rotation === undefined,
                    () => (
                      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        Sem registro de rotação em <code>auth.audit_log_entries</code> — idade
                        indeterminada.
                      </div>
                    ),
                  ],
                ],
                () => (
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Última rotação</span>
                      <span className="font-mono text-xs">
                        {fmtWhen(signingData?.last_rotation ?? null)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm">Idade</span>
                      <Badge
                        variant="outline"
                        className={signingData?.needs_rotation ? AMBER : GREEN}
                      >
                        {signingData?.age_days ?? '—'} dias
                      </Badge>
                    </div>
                  </div>
                )
              )
            }
          </QueryBody>
        </CardContent>
      </Card>

      {/* Arquivamentos pendentes de verificacao */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" /> Arquivamentos sem verificação
          </CardTitle>
          <CardDescription>
            Partições arquivadas há mais tempo que o SLA e sem checksum conferido.{' '}
            <code>admin_stale_archive_verifications</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueryBody query={archives} label="Erro ao listar arquivamentos">
            {() =>
              matchFirst<ReactNode>(
                [
                  [
                    archiveRows.length === 0,
                    () => (
                      <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                        <MinusCircle className="h-4 w-4" />
                        Nenhum arquivamento pendente de verificação.
                      </div>
                    ),
                  ],
                ],
                () => (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partição</TableHead>
                          <TableHead>Arquivada em</TableHead>
                          <TableHead className="text-right">Idade (h)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archiveRows.map((r) => (
                          <TableRow key={r.archive_id}>
                            <TableCell className="font-mono text-xs">{r.partition_name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtWhen(r.archived_at)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {num(r.age_hours).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )
            }
          </QueryBody>
        </CardContent>
      </Card>
    </>
  );
}
