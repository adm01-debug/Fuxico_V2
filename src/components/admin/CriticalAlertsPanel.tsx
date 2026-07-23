import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminRpc } from "@/lib/admin-rpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Filter, RefreshCw } from "lucide-react";

type AlertRow = {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  dispatch_status: "sent" | "failed" | "skipped" | "pending";
  dispatched_at: string | null;
  admin_count: number;
  channels: string[];
  error_message: string | null;
  total_count: number;
};

type SummaryRow = {
  event_type: string;
  severity: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  last_seen: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  info: "bg-muted text-muted-foreground border-border",
};

const DISPATCH_STYLES: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  skipped: "bg-muted text-muted-foreground border-border",
};

export function CriticalAlertsPanel() {
  const [hours, setHours] = useState<number>(72);
  const [eventType, setEventType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("all");
  const [dispatch, setDispatch] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const severities =
    severity === "all"
      ? ["critical", "high", "error", "warning"]
      : [severity];

  const summary = useQuery({
    queryKey: ["admin_critical_alerts_summary", hours, refreshKey],
    queryFn: () =>
      adminRpc<SummaryRow[]>("admin_critical_alerts_summary", { _hours: hours }),
    staleTime: 30_000,
  });

  const alerts = useQuery({
    queryKey: [
      "admin_list_critical_alerts",
      hours,
      eventType,
      severity,
      dispatch,
      refreshKey,
    ],
    queryFn: () =>
      adminRpc<AlertRow[]>("admin_list_critical_alerts", {
        _hours: hours,
        _event_types: eventType.trim() ? [eventType.trim()] : null,
        _severities: severities,
        _dispatch_status: dispatch === "all" ? null : dispatch,
        _limit: 200,
        _offset: 0,
      }),
    staleTime: 30_000,
  });

  const total = alerts.data?.[0]?.total_count ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alertas Críticos
            </CardTitle>
            <CardDescription>
              Eventos de segurança consolidados com status de despacho para admins
              (arquivos, webhooks e afins).
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Filter className="w-3 h-3" /> Janela (h)
            </label>
            <Input
              type="number"
              min={1}
              max={720}
              value={hours}
              onChange={(e) =>
                setHours(Math.max(1, Number(e.target.value) || 72))
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Tipo de evento
            </label>
            <Input
              placeholder="ex: archive_verification_spike"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Severidade
            </label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Despacho
            </label>
            <Select value={dispatch} onValueChange={setDispatch}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="skipped">Ignorado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sumário por tipo */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Sumário ({hours}h) — {summary.data?.length ?? 0} tipos
          </h3>
          {summary.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (summary.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum alerta no período. 🎉
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead>Último</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary.data ?? []).map((r) => (
                    <TableRow key={`${r.event_type}:${r.severity}`}>
                      <TableCell className="font-mono text-xs">
                        {r.event_type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={SEVERITY_STYLES[r.severity] ?? ""}
                        >
                          {r.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {r.total}
                      </TableCell>
                      <TableCell className="text-right text-emerald-500">
                        {r.sent}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {r.failed}
                      </TableCell>
                      <TableCell className="text-right text-amber-500">
                        {r.pending}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.last_seen).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Lista de eventos */}
        <div>
          <h3 className="text-sm font-semibold mb-2">
            Eventos ({total} no filtro atual)
          </h3>
          {alerts.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (alerts.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nada encontrado para os filtros escolhidos.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Despacho</TableHead>
                    <TableHead className="text-right">Admins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(alerts.data ?? []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(a.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {a.event_type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={SEVERITY_STYLES[a.severity] ?? ""}
                        >
                          {a.severity}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="max-w-md truncate text-xs"
                        title={a.description}
                      >
                        {a.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={DISPATCH_STYLES[a.dispatch_status] ?? ""}
                        >
                          {a.dispatch_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.admin_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
