import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { adminRpc } from "@/lib/admin-rpc";
import { cn } from "@/lib/utils";

interface FailureRow {
  webhook_id: string;
  webhook_url: string | null;
  is_active: boolean | null;
  total_24h: number;
  success_24h: number;
  failure_24h: number;
  failure_rate_24h: number;
  total_7d: number;
  success_7d: number;
  failure_7d: number;
  failure_rate_7d: number;
  last_failure_at: string | null;
  last_success_at: string | null;
}

function fmt(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return ts;
  }
}

function rateBadge(rate: number) {
  const cls =
    rate >= 25
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : rate >= 5
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", cls)}>
      {rate.toFixed(2)}%
    </Badge>
  );
}

function WebhookFailureRatesTableBase() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin_webhook_failure_rates"],
    queryFn: () => adminRpc<FailureRow[]>("admin_webhook_failure_rates"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const rows = data ?? [];
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.total += Number(r.total_24h);
        acc.fail += Number(r.failure_24h);
        return acc;
      },
      { total: 0, fail: 0 },
    );
  }, [rows]);

  const globalRate = totals.total > 0 ? (totals.fail / totals.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" /> Taxas de Falha por Webhook
        </CardTitle>
        <CardDescription>
          Sucessos e falhas agregados de <code>webhook_logs</code> nas últimas 24 horas e 7 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total 24h</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : totals.total.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-destructive">Falhas 24h</p>
            <p className="text-2xl font-bold text-destructive">
              {isLoading ? <Skeleton className="h-7 w-16" /> : totals.fail.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Taxa global 24h</p>
            <p className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-7 w-16" /> : `${globalRate.toFixed(2)}%`}
            </p>
          </div>
        </div>

        {isError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Erro ao carregar taxas: {error instanceof Error ? error.message : "erro desconhecido"}
          </div>
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            Nenhum evento de webhook registrado nos últimos 7 dias.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead className="text-right">Total 24h</TableHead>
                  <TableHead className="text-right">Falhas 24h</TableHead>
                  <TableHead>Taxa 24h</TableHead>
                  <TableHead className="text-right">Total 7d</TableHead>
                  <TableHead className="text-right">Falhas 7d</TableHead>
                  <TableHead>Taxa 7d</TableHead>
                  <TableHead>Última falha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.webhook_id}>
                    <TableCell className="max-w-[260px]">
                      <p className="text-xs text-muted-foreground truncate" title={r.webhook_url ?? ""}>
                        {r.webhook_url ?? r.webhook_id.slice(0, 8)}
                      </p>
                      {r.is_active === false && (
                        <Badge variant="outline" className="mt-1 text-[10px]">inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.total_24h}</TableCell>
                    <TableCell className="text-right font-mono">{r.failure_24h}</TableCell>
                    <TableCell>{rateBadge(Number(r.failure_rate_24h))}</TableCell>
                    <TableCell className="text-right font-mono">{r.total_7d}</TableCell>
                    <TableCell className="text-right font-mono">{r.failure_7d}</TableCell>
                    <TableCell>{rateBadge(Number(r.failure_rate_7d))}</TableCell>
                    <TableCell className="text-xs">{fmt(r.last_failure_at)}</TableCell>
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

export const WebhookFailureRatesTable = memo(WebhookFailureRatesTableBase);
