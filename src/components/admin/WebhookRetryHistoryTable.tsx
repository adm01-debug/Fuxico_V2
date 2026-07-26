import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, History, CheckCircle2 } from "lucide-react";
import { adminRpc } from "@/lib/admin-rpc";
import { cn } from "@/lib/utils";
import { matchFirst } from "@/lib/variant";

interface RetryRow {
  id: string;
  webhook_id: string;
  webhook_url: string | null;
  event_type: string;
  attempts: number;
  max_attempts: number;
  status: string;
  last_error: string | null;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

function fmt(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return ts;
  }
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  const cls =
    matchFirst([
  [s === "failed" || s === "dead_letter", () => ("bg-destructive/15 text-destructive border-destructive/30")],
  [s === "pending" || s === "retrying", () => ("bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30")],
  [s === "delivered" || s === "success", () => ("bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30")],
], () => ("bg-muted text-muted-foreground border-border"));
  return (
    <Badge variant="outline" className={cn("font-mono text-xs uppercase", cls)}>
      {status}
    </Badge>
  );
}

function WebhookRetryHistoryTableBase() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin_webhook_retry_history"],
    queryFn: () => adminRpc<RetryRow[]>("admin_webhook_retry_history", { _limit: 200 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const rows = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Histórico de Retries
        </CardTitle>
        <CardDescription>
          Últimas 200 entradas da fila <code>webhook_retry_queue</code>, com backoff exponencial e status atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matchFirst([
  [isError, () => ((
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Erro ao carregar histórico: {error instanceof Error ? error.message : "erro desconhecido"}
          </div>
        ))],
  [isLoading, () => ((
          <Skeleton className="h-40 w-full" />
        ))],
  [rows.length === 0, () => ((
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            Nenhum retry na fila. Todos os webhooks foram entregues no primeiro envio.
          </div>
        ))],
], () => ((
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tentativas</TableHead>
                  <TableHead>Próx. tentativa</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead>Último erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[220px]">
                      <p className="text-xs text-muted-foreground truncate" title={r.webhook_url ?? ""}>
                        {r.webhook_url ?? r.webhook_id.slice(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{r.event_type}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {r.attempts}/{r.max_attempts}
                    </TableCell>
                    <TableCell className="text-xs">{fmt(r.next_attempt_at)}</TableCell>
                    <TableCell className="text-xs">{fmt(r.updated_at)}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <p className="text-xs text-muted-foreground truncate" title={r.last_error ?? ""}>
                        {r.last_error ?? "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )))}
      </CardContent>
    </Card>
  );
}

export const WebhookRetryHistoryTable = memo(WebhookRetryHistoryTableBase);
