import { memo, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminRpc } from "@/lib/admin-rpc";
import { cn } from "@/lib/utils";

interface CircuitRow {
  webhook_id: string;
  webhook_name: string | null;
  webhook_url: string | null;
  owner_user_id: string | null;
  state: "open" | "half_open" | "closed";
  consecutive_failures: number;
  opened_at: string | null;
  last_failure_at: string | null;
  last_success_at: string | null;
  next_probe_at: string | null;
  updated_at: string;
}

function stateBadge(state: CircuitRow["state"]) {
  const map: Record<CircuitRow["state"], { label: string; cls: string }> = {
    open: { label: "OPEN", cls: "bg-destructive/15 text-destructive border-destructive/30" },
    half_open: { label: "HALF-OPEN", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    closed: { label: "CLOSED", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  };
  const { label, cls } = map[state] ?? map.closed;
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", cls)}>
      {label}
    </Badge>
  );
}

function fmt(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return ts;
  }
}

function WebhookCircuitDashboardBase() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin_webhook_circuit_dashboard"],
    queryFn: () => adminRpc<CircuitRow[]>("admin_webhook_circuit_dashboard"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const resetMutation = useMutation({
    mutationFn: (webhookId: string) =>
      adminRpc<{ reset: boolean }>("admin_reset_webhook_circuit", { _webhook_id: webhookId }),
    onSuccess: () => {
      toast.success("Circuit breaker resetado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin_webhook_circuit_dashboard"] });
    },
    onError: (e: unknown) => {
      toast.error(`Falha ao resetar: ${e instanceof Error ? e.message : "erro desconhecido"}`);
    },
  });

  const summary = useMemo(() => {
    const rows = data ?? [];
    return {
      total: rows.length,
      open: rows.filter((r) => r.state === "open").length,
      half: rows.filter((r) => r.state === "half_open").length,
      closed: rows.filter((r) => r.state === "closed").length,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Circuit Breakers de Webhooks
          </CardTitle>
          <CardDescription>
            Estado atual dos disjuntores por webhook. Falhas consecutivas ≥ 5 abrem o circuito e bloqueiam envios até a próxima sondagem.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Atualizar circuit breakers"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total monitorados</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-10" /> : summary.total}</p>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-destructive">Abertos</p>
            <p className="text-2xl font-bold text-destructive">{isLoading ? <Skeleton className="h-7 w-10" /> : summary.open}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">Half-Open</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isLoading ? <Skeleton className="h-7 w-10" /> : summary.half}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Fechados (saudáveis)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading ? <Skeleton className="h-7 w-10" /> : summary.closed}
            </p>
          </div>
        </div>

        {isError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Erro ao carregar circuit breakers: {error instanceof Error ? error.message : "erro desconhecido"}
          </div>
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : summary.total === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            Nenhum circuit breaker ativo. Todos os webhooks estão saudáveis.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Falhas seq.</TableHead>
                  <TableHead>Aberto em</TableHead>
                  <TableHead>Última falha</TableHead>
                  <TableHead>Próxima sondagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => (
                  <TableRow key={row.webhook_id}>
                    <TableCell className="max-w-[240px]">
                      <p className="font-medium truncate" title={row.webhook_name ?? row.webhook_id}>
                        {row.webhook_name ?? row.webhook_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" title={row.webhook_url ?? ""}>
                        {row.webhook_url ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell>{stateBadge(row.state)}</TableCell>
                    <TableCell className="text-right font-mono">{row.consecutive_failures}</TableCell>
                    <TableCell className="text-xs">{fmt(row.opened_at)}</TableCell>
                    <TableCell className="text-xs">{fmt(row.last_failure_at)}</TableCell>
                    <TableCell className="text-xs">{fmt(row.next_probe_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={row.state === "closed" || resetMutation.isPending}
                        onClick={() => resetMutation.mutate(row.webhook_id)}
                      >
                        Resetar
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
  );
}

export const WebhookCircuitDashboard = memo(WebhookCircuitDashboardBase);
