import { memo, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Camera, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { adminRpc } from "@/lib/admin-rpc";
import { cn } from "@/lib/utils";

interface SnapshotRow {
  id: string;
  score: number;
  grade: string;
  breakdown: Record<string, number | string | null>;
  captured_by: string | null;
  source: string;
  created_at: string;
}

const LABELS: Record<string, string> = {
  cron_failures_24h: "Falhas cron 24h",
  cron_failures_7d: "Falhas cron 7d",
  critical_events_24h: "Alertas críticos 24h",
  circuits_open: "Circuits open",
  dsar_sla_misses: "DSAR fora do prazo",
  retry_queue_depth: "Fila de retries",
  rls_canary_failures_24h: "Canário RLS 24h",
  pool_utilization_pct: "Pool util. (%)",
  signing_key_age_days: "Signing key (dias)",
};

function gradeCls(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (grade === "B") return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
  if (grade === "C") return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function fmt(ts: string): string {
  try {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return ts;
  }
}

function HealthScoreSnapshotHistoryBase() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin_list_health_score_snapshots"],
    queryFn: () => adminRpc<SnapshotRow[]>("admin_list_health_score_snapshots", { _limit: 50 }),
    staleTime: 30_000,
  });

  const captureMutation = useMutation({
    mutationFn: () =>
      adminRpc<SnapshotRow>("admin_capture_health_score_snapshot", { _source: "manual" }),
    onSuccess: (row) => {
      toast.success(`Snapshot registrado — Nota ${row.grade} (${Number(row.score).toFixed(2)})`);
      qc.invalidateQueries({ queryKey: ["admin_list_health_score_snapshots"] });
    },
    onError: (e: unknown) => {
      toast.error(`Falha ao capturar snapshot: ${e instanceof Error ? e.message : "erro desconhecido"}`);
    },
  });

  const rows = data ?? [];
  const latest = rows[0];

  const indicatorKeys = useMemo(() => {
    if (!latest) return [];
    return Object.keys(latest.breakdown).filter((k) => k in LABELS || true);
  }, [latest]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Snapshots do Health Score
          </CardTitle>
          <CardDescription>
            Relatório de auditoria com o histórico de execuções do <code>admin_system_health_score</code>. Snapshot automático diário às 08:00 UTC.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => captureMutation.mutate()}
          disabled={captureMutation.isPending}
        >
          <Camera className={cn("w-4 h-4 mr-2", captureMutation.isPending && "animate-pulse")} />
          Capturar snapshot
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums">{Number(latest.score).toFixed(2)}</span>
              <span className="text-muted-foreground">/ 10</span>
              <Badge variant="outline" className={cn("font-mono", gradeCls(latest.grade))}>
                Nota {latest.grade}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                Último snapshot: {fmt(latest.created_at)} · fonte: <code>{latest.source}</code>
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {indicatorKeys.map((k) => (
                <div key={k} className="rounded-md border p-2">
                  <p className="text-[11px] text-muted-foreground">{LABELS[k] ?? k}</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {latest.breakdown[k] === null || latest.breakdown[k] === undefined
                      ? "—"
                      : String(latest.breakdown[k])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Erro ao carregar snapshots: {error instanceof Error ? error.message : "erro desconhecido"}
          </div>
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
            Nenhum snapshot registrado ainda. Clique em <strong>Capturar snapshot</strong>.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/hora</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-right">Cron 24h</TableHead>
                  <TableHead className="text-right">Alertas 24h</TableHead>
                  <TableHead className="text-right">Circuits</TableHead>
                  <TableHead className="text-right">Retry Q.</TableHead>
                  <TableHead className="text-right">Canário RLS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{fmt(r.created_at)}</TableCell>
                    <TableCell className="text-right font-mono">{Number(r.score).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-mono text-xs", gradeCls(r.grade))}>
                        {r.grade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <code>{r.source}</code>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.breakdown?.cron_failures_24h ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.breakdown?.critical_events_24h ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.breakdown?.circuits_open ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.breakdown?.retry_queue_depth ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.breakdown?.rls_canary_failures_24h ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const HealthScoreSnapshotHistory = memo(HealthScoreSnapshotHistoryBase);
