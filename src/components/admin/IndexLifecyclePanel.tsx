import { memo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
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
  BarChart3,
  FlaskConical,
  Radar,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminRpc } from '@/lib/admin-rpc';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { matchFirst } from '@/lib/variant';

interface StaleIndexRow {
  schema_name: string;
  table_name: string;
  index_name: string;
  current_scans: number;
  scans_delta: number;
  index_size: string;
  first_seen: string | null;
  last_seen: string | null;
}

interface IndexPreview {
  verdict: 'safe' | 'blocked';
  safe: boolean;
  reason: string | null;
  schema_name: string;
  table_name: string;
  index_name: string;
  index_definition: string;
  index_size_bytes: number;
  is_unique: boolean;
  is_primary: boolean;
  supports_constraint: boolean;
  scans_recent_7d: number;
  scans_total: number;
}

interface PreDropResult {
  ok: boolean;
  analysis_id: string;
  schema_name: string;
  table_name: string;
  queries_captured: number;
  baseline_total_cost: number;
}

interface PostDropResult {
  ok?: boolean;
  verdict?: string;
  improved: number;
  regressed: number;
  neutral: number;
  baseline_total_cost: number;
  post_total_cost: number;
  delta_pct?: number;
  pending_drop?: boolean;
  analysis_not_found?: boolean;
  error?: string;
}

const POST_ERROR_LABELS: Record<string, string> = {
  pending_drop: 'O índice ainda não foi removido — rode o DROP antes de comparar.',
  analysis_not_found: 'Análise não encontrada — capture o baseline novamente.',
  invalid_status: 'Esta análise não está pronta para comparação.',
};

interface DropResult {
  ok: boolean;
  dry_run?: boolean;
  drop_id?: string;
  error?: string;
  reason?: string;
  sqlerrm?: string;
  preview?: IndexPreview;
  baseline?: PreDropResult | null;
  analysis_id?: string | null;
  post?: PostDropResult | null;
}

interface StagnantResult {
  ok: boolean;
  alerts_created: number;
  notifications_sent: number;
  threshold_days: number;
  threshold_size_mb: number;
}

const REASON_LABELS: Record<string, string> = {
  primary_key: 'Chave primária',
  unique_index: 'Índice único',
  supports_constraint: 'Sustenta uma constraint',
  recent_scans: 'Teve leituras nos últimos 7 dias',
  index_not_found: 'Índice não encontrado',
};

function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtWhen(ts: string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return ts;
  }
}

const VERDICT_LABELS: Record<string, string> = {
  improved: 'Melhorou',
  neutral: 'Sem efeito',
  regressed: 'Piorou',
  mixed: 'Misto',
};

function IndexLifecyclePanelBase() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [days, setDays] = useState(90);
  const [minDays, setMinDays] = useState(90);
  const [minSizeMb, setMinSizeMb] = useState(10);
  const [previewOf, setPreviewOf] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState('');
  const [lastAction, setLastAction] = useState<DropResult | null>(null);

  const stale = useQuery({
    queryKey: ['admin_stale_indexes', days],
    queryFn: () => adminRpc<StaleIndexRow[]>('admin_stale_indexes', { _days: days }),
    staleTime: 60_000,
  });

  const detect = useMutation({
    mutationFn: () =>
      adminRpc<StagnantResult>('check_stagnant_indexes', {
        _min_days: minDays,
        _min_size_mb: minSizeMb,
      }),
    onSuccess: (r) => {
      toast.success(
        `Varredura concluída — ${r.alerts_created} alerta(s) criado(s) e ${r.notifications_sent} admin(s) notificado(s).`
      );
      qc.invalidateQueries({ queryKey: ['admin_stale_indexes'] });
    },
    onError: (e: unknown) =>
      toast.error(`Falha na varredura: ${e instanceof Error ? e.message : 'erro desconhecido'}`),
  });

  const preview = useMutation({
    mutationFn: (indexName: string) =>
      adminRpc<IndexPreview>('admin_preview_index_drop', { _index_name: indexName }),
    onSuccess: (r) => setPreviewOf(r.index_name),
    onError: (e: unknown) =>
      toast.error(`Falha na prévia: ${e instanceof Error ? e.message : 'erro desconhecido'}`),
  });

  const baseline = useMutation({
    mutationFn: (indexName: string) =>
      adminRpc<PreDropResult>('analyze_index_pre_drop', { _index_name: indexName, _top_n: 10 }),
    onSuccess: (r) => {
      setAnalysisId(r.analysis_id);
      toast.success(
        `Baseline capturado (${r.queries_captured} query(s) mapeada(s)). Use a análise ${r.analysis_id.slice(0, 8)} após o DROP.`
      );
    },
    onError: (e: unknown) =>
      toast.error(`Falha no baseline: ${e instanceof Error ? e.message : 'erro desconhecido'}`),
  });

  const post = useMutation({
    mutationFn: (id: string) =>
      adminRpc<PostDropResult>('analyze_index_post_drop', { _analysis_id: id }),
    onSuccess: (r) => {
      if (r.ok === false) {
        const key = r.error ?? (r.pending_drop ? 'pending_drop' : '');
        toast.error(POST_ERROR_LABELS[key] ?? r.error ?? 'Não foi possível comparar o impacto.');
        return;
      }
      toast.success(
        `Veredito: ${VERDICT_LABELS[r.verdict ?? ''] ?? r.verdict} — ${r.improved} melhorou, ${r.regressed} regrediu, ${r.neutral} neutro.`
      );
    },
    onError: (e: unknown) =>
      toast.error(
        `Falha na análise pós-drop: ${e instanceof Error ? e.message : 'erro desconhecido'}`
      ),
  });

  const drop = useMutation({
    mutationFn: ({ indexName, dryRun }: { indexName: string; dryRun: boolean }) =>
      adminRpc<DropResult>('admin_execute_index_drop', {
        _index_name: indexName,
        _dry_run: dryRun,
        _force: false,
        _requested_by: user?.id ?? null,
        _capture_baseline: true,
      }),
    onSuccess: (r) => {
      setLastAction(r);
      if (!r.ok) {
        toast.error(
          `DROP recusado (${r.error ?? 'erro'}): ${
            REASON_LABELS[r.reason ?? ''] ?? r.reason ?? r.sqlerrm ?? 'sem detalhe'
          }`
        );
        return;
      }
      toast.success(
        r.dry_run
          ? 'Simulação concluída — nenhum índice foi removido.'
          : `Índice removido${r.analysis_id ? ' e impacto medido' : ''}.`
      );
      if (!r.dry_run) {
        qc.invalidateQueries({ queryKey: ['admin_stale_indexes'] });
        qc.invalidateQueries({ queryKey: ['stale_index_drops'] });
      }
    },
    onError: (e: unknown) =>
      toast.error(
        `Falha ao executar DROP: ${e instanceof Error ? e.message : 'erro desconhecido'}`
      ),
  });

  const rows = stale.data ?? [];
  const previewData = lastAction?.preview;
  const activePreview = preview.data;
  const canAct = !!user?.id;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-primary" /> Índices ociosos
            </CardTitle>
            <CardDescription>
              Índices sem nenhuma leitura no período, com o tamanho que ocupam hoje.{' '}
              <code>admin_stale_indexes</code>
            </CardDescription>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="stale-days" className="text-xs">
                Dias sem uso
              </Label>
              <Input
                id="stale-days"
                type="number"
                min={7}
                max={3650}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 90)}
                className="h-9 w-24"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => stale.refetch()}
              disabled={stale.isFetching}
            >
              <Activity className={cn('mr-2 h-4 w-4', stale.isFetching && 'animate-pulse')} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {matchFirst(
            [
              [
                stale.isError,
                () => (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Erro ao listar índices ociosos:{' '}
                    {stale.error instanceof Error ? stale.error.message : 'erro desconhecido'}
                  </div>
                ),
              ],
              [stale.isLoading, () => <Skeleton className="h-40 w-full" />],
              [
                rows.length === 0,
                () => (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhum índice ocioso há {days}+ dias. Nada a remover. 🎉
                  </div>
                ),
              ],
            ],
            () => (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Índice</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead className="text-right">Leituras</TableHead>
                      <TableHead className="text-right">Δ leituras</TableHead>
                      <TableHead className="text-right">Tamanho</TableHead>
                      <TableHead>Última leitura</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={`${r.schema_name}.${r.index_name}`}>
                        <TableCell className="font-mono text-xs">{r.index_name}</TableCell>
                        <TableCell className="font-mono text-xs">{r.table_name}</TableCell>
                        <TableCell className="text-right font-mono">{r.current_scans}</TableCell>
                        <TableCell className="text-right font-mono">{r.scans_delta}</TableCell>
                        <TableCell className="text-right font-mono">{r.index_size}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtWhen(r.last_seen)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={preview.isPending || baseline.isPending}
                              onClick={() => preview.mutate(r.index_name)}
                            >
                              <Search className="mr-1 h-3 w-3" />
                              Analisar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={baseline.isPending || !canAct}
                              onClick={() => baseline.mutate(r.index_name)}
                            >
                              <BarChart3 className="mr-1 h-3 w-3" />
                              Baseline
                            </Button>
                          </div>
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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" /> Varredura de candidatos
            </CardTitle>
            <CardDescription>
              Cruza o histórico de uso com o tamanho e dispara alerta + notificação aos admins para
              cada índice ocioso encontrado. <code>check_stagnant_indexes</code>
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => detect.mutate()} disabled={detect.isPending}>
            <FlaskConical className={cn('mr-2 h-4 w-4', detect.isPending && 'animate-pulse')} />
            {detect.isPending ? 'Varrendo...' : 'Varrer agora'}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="min-days" className="text-xs">
              Dias sem uso
            </Label>
            <Input
              id="min-days"
              type="number"
              min={7}
              max={3650}
              value={minDays}
              onChange={(e) => setMinDays(Number(e.target.value) || 90)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="min-size" className="text-xs">
              Tamanho mínimo (MB)
            </Label>
            <Input
              id="min-size"
              type="number"
              min={0}
              max={10240}
              value={minSizeMb}
              onChange={(e) => setMinSizeMb(Number(e.target.value) || 10)}
            />
          </div>
          <div className="flex items-end text-xs text-muted-foreground">
            Alertas duplicados são evitados por advisory lock — rodar duas vezes seguidas não
            duplica notificações.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Análise de impacto
          </CardTitle>
          <CardDescription>
            Compare o custo das queries antes e depois do DROP. Use o identificador gerado pelo
            baseline. <code>analyze_index_post_drop</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[280px] flex-1 space-y-1">
              <Label htmlFor="analysis-id" className="text-xs">
                ID da análise (baseline)
              </Label>
              <Input
                id="analysis-id"
                value={analysisId}
                onChange={(e) => setAnalysisId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={() => post.mutate(analysisId.trim())}
              disabled={!analysisId.trim() || post.isPending}
            >
              {post.isPending ? 'Comparando...' : 'Verificar pós-drop'}
            </Button>
          </div>
          {post.data && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
              <Badge
                variant="outline"
                className={
                  post.data.verdict === 'improved'
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : post.data.verdict === 'regressed'
                      ? 'border-destructive/30 text-destructive'
                      : ''
                }
              >
                {VERDICT_LABELS[post.data.verdict ?? ''] ?? post.data.verdict ?? '—'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                custo antes {Number(post.data.baseline_total_cost).toFixed(2)} · depois{' '}
                {Number(post.data.post_total_cost).toFixed(2)}
              </span>
              <span className="text-xs">
                {post.data.improved} melhorou · {post.data.neutral} neutro · {post.data.regressed}{' '}
                piorou
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {lastAction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-primary" /> Resultado da última ação
            </CardTitle>
            <CardDescription>
              {lastAction.ok
                ? lastAction.dry_run
                  ? 'Simulação (dry-run) — nada foi alterado.'
                  : 'Execução real registrada em stale_index_drops.'
                : `Recusado: ${lastAction.error ?? 'erro'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
              {JSON.stringify(lastAction, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!activePreview || !!previewData}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewOf(null);
            setLastAction(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{(activePreview ?? previewData)?.index_name}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      (activePreview ?? previewData)?.safe
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-destructive/30 text-destructive'
                    }
                  >
                    {(activePreview ?? previewData)?.safe ? 'SEGURO' : 'BLOQUEADO'}
                  </Badge>
                  {(activePreview ?? previewData)?.reason && (
                    <span className="text-xs">
                      {REASON_LABELS[(activePreview ?? previewData)?.reason ?? ''] ??
                        (activePreview ?? previewData)?.reason}
                    </span>
                  )}
                  <span className="text-xs">
                    {(activePreview ?? previewData)?.scans_recent_7d} leitura(s) em 7 dias ·{' '}
                    {fmtBytes((activePreview ?? previewData)?.index_size_bytes ?? 0)}
                  </span>
                </div>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {(activePreview ?? previewData)?.index_definition}
                </pre>
                <p className="text-xs">
                  A simulação roda <code>EXPLAIN</code> e grava o baseline sem tocar no índice.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel onClick={() => setPreviewOf(null)}>Fechar</AlertDialogCancel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                variant="outline"
                disabled={drop.isPending || !canAct}
                onClick={() => previewOf && drop.mutate({ indexName: previewOf, dryRun: true })}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Simular DROP
              </Button>
              <AlertDialogAction
                disabled={drop.isPending || !canAct}
                onClick={() => {
                  if (!previewOf) return;
                  drop.mutate({ indexName: previewOf, dryRun: false });
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Executar DROP
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const IndexLifecyclePanel = memo(IndexLifecyclePanelBase);
