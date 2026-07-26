import { useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Download, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

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

const CSV_COLUMNS: Array<{ key: keyof AlertRow; label: string }> = [
  { key: "created_at", label: "created_at" },
  { key: "event_type", label: "event_type" },
  { key: "severity", label: "severity" },
  { key: "description", label: "description" },
  { key: "dispatch_status", label: "dispatch_status" },
  { key: "dispatched_at", label: "dispatched_at" },
  { key: "admin_count", label: "admin_count" },
  { key: "channels", label: "channels" },
  { key: "error_message", label: "error_message" },
  { key: "id", label: "id" },
  { key: "metadata", label: "metadata" },
];

// CSV injection guard: prefixa fórmulas com apóstrofo
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : JSON.stringify(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: AlertRow[]): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const body = rows
    .map((r) =>
      CSV_COLUMNS.map((c) => {
        const v = r[c.key];
        if (Array.isArray(v)) return sanitizeCsvCell(v.join("|"));
        return sanitizeCsvCell(v);
      }).join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

/** Parser de busca avançada: termos livres, "frases", campo:valor e -exclusão. */
type ParsedQuery = {
  include: string[];
  exclude: string[];
  fields: Array<{ field: string; value: string }>;
};

const SEARCHABLE_FIELDS = [
  "id",
  "event_type",
  "severity",
  "description",
  "dispatch_status",
  "error_message",
  "metadata",
  "channels",
] as const;

function parseQuery(raw: string): ParsedQuery {
  const out: ParsedQuery = { include: [], exclude: [], fields: [] };
  const tokens = raw.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  for (const tokenRaw of tokens) {
    let token = tokenRaw.trim();
    if (!token) continue;
    let negated = false;
    if (token.startsWith("-") && token.length > 1) {
      negated = true;
      token = token.slice(1);
    }
    const fieldMatch = /^([a-z_]+):(.*)$/i.exec(token);
    if (fieldMatch && (SEARCHABLE_FIELDS as readonly string[]).includes(fieldMatch[1].toLowerCase())) {
      const value = fieldMatch[2].replace(/^"|"$/g, "").toLowerCase();
      if (!value) continue;
      if (negated) out.exclude.push(value);
      else out.fields.push({ field: fieldMatch[1].toLowerCase(), value });
      continue;
    }
    const clean = token.replace(/^"|"$/g, "").toLowerCase();
    if (!clean) continue;
    if (negated) out.exclude.push(clean);
    else out.include.push(clean);
  }
  return out;
}

function fieldText(row: AlertRow, field: string): string {
  const v = row[field as keyof AlertRow];
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(" ");
  return typeof v === "string" ? v : JSON.stringify(v);
}

function rowHaystack(row: AlertRow): string {
  return SEARCHABLE_FIELDS.map((f) => fieldText(row, f)).join(" \u0000 ").toLowerCase();
}

function matchesQuery(row: AlertRow, q: ParsedQuery): boolean {
  const hay = rowHaystack(row);
  if (q.exclude.some((t) => hay.includes(t))) return false;
  if (!q.include.every((t) => hay.includes(t))) return false;
  return q.fields.every((f) => fieldText(row, f.field).toLowerCase().includes(f.value));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Destaca todos os termos de busca dentro de um texto. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const valid = terms.filter((t) => t.length > 0);
  if (valid.length === 0) return <>{text}</>;
  const re = new RegExp(`(${valid.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part) && valid.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <mark
            key={`${part}-${i}`}
            className="bg-amber-500/30 text-foreground rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${i}`}>{part}</span>
        ),
      )}
    </>
  );
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CriticalAlertsPanel() {
  const [hours, setHours] = useState<number>(72);
  const [eventType, setEventType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("all");
  const [dispatch, setDispatch] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<AlertRow | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");

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
      page,
      pageSize,
      refreshKey,
    ],
    queryFn: () =>
      adminRpc<AlertRow[]>("admin_list_critical_alerts", {
        _hours: hours,
        _event_types: eventType.trim() ? [eventType.trim()] : null,
        _severities: severities,
        _dispatch_status: dispatch === "all" ? null : dispatch,
        _limit: pageSize,
        _offset: page * pageSize,
      }),
    staleTime: 30_000,
  });

  const total = alerts.data?.[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Busca avançada (client-side, sobre a página carregada)
  const parsed = useMemo(() => parseQuery(search), [search]);
  const highlightTerms = useMemo(
    () => [...parsed.include, ...parsed.fields.map((f) => f.value)],
    [parsed],
  );
  const rows = alerts.data ?? [];
  const visibleRows = useMemo(
    () =>
      search.trim() ? rows.filter((r) => matchesQuery(r, parsed)) : rows,
    [rows, parsed, search],
  );

  /** Trecho do metadata que casa com a busca, para exibir inline. */
  const metaSnippet = (row: AlertRow): string | null => {
    if (highlightTerms.length === 0) return null;
    const json = JSON.stringify(row.metadata ?? {});
    const lower = json.toLowerCase();
    const idx = highlightTerms
      .map((t) => lower.indexOf(t))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];
    if (idx === undefined) return null;
    const start = Math.max(0, idx - 40);
    const end = Math.min(json.length, idx + 80);
    return `${start > 0 ? "…" : ""}${json.slice(start, end)}${end < json.length ? "…" : ""}`;
  };

  const handleExportCsv = async (): Promise<void> => {
    const HARD_CAP = 5000;
    const cap = Math.min(total, HARD_CAP);
    if (cap === 0) {
      toast.warning("Nada para exportar no filtro atual.");
      return;
    }
    try {
      const chunkSize = 500;
      const acc: AlertRow[] = [];
      for (let offset = 0; offset < cap; offset += chunkSize) {
        const limit = Math.min(chunkSize, cap - offset);
        const rows = await adminRpc<AlertRow[]>("admin_list_critical_alerts", {
          _hours: hours,
          _event_types: eventType.trim() ? [eventType.trim()] : null,
          _severities: severities,
          _dispatch_status: dispatch === "all" ? null : dispatch,
          _limit: limit,
          _offset: offset,
        });
        acc.push(...rows);
        if (rows.length < limit) break;
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `critical-alerts_${hours}h_${stamp}.csv`;
      downloadCsv(filename, toCsv(acc));
      const truncated = total > HARD_CAP ? ` (truncado em ${HARD_CAP} de ${total})` : "";
      toast.success(`Exportado: ${acc.length} evento(s) → ${filename}${truncated}`);
    } catch (e) {
      toast.error(`Falha na exportação: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={alerts.isLoading || (alerts.data ?? []).length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
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
              onChange={(e) => {
                setHours(Math.max(1, Number(e.target.value) || 72));
                setPage(0);
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Tipo de evento
            </label>
            <Input
              placeholder="ex: archive_verification_spike"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Severidade
            </label>
            <Select
              value={severity}
              onValueChange={(v) => {
                setSeverity(v);
                setPage(0);
              }}
            >
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
            <Select
              value={dispatch}
              onValueChange={(v) => {
                setDispatch(v);
                setPage(0);
              }}
            >
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
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(alerts.data ?? []).map((a) => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(a)}
                    >
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
                      <TableCell className="text-right">
                        <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginação server-side */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs">
              <div className="text-muted-foreground">
                Página <span className="font-semibold text-foreground">{page + 1}</span> de{" "}
                <span className="font-semibold text-foreground">{totalPages}</span> —{" "}
                mostrando {page * pageSize + 1}–
                {Math.min(total, page * pageSize + (alerts.data?.length ?? 0))} de {total}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">Por página:</label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || alerts.isFetching}
                  onClick={() => setPage(0)}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || alerts.isFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ‹ Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || alerts.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || alerts.isFetching}
                  onClick={() => setPage(totalPages - 1)}
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Drill-down: detalhes + JSON viewer */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Detalhe do alerta
            </DialogTitle>
            <DialogDescription>
              Inspeção completa do evento e do payload de metadata.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo" value={selected.event_type} mono />
                <Field label="Severidade" value={selected.severity} />
                <Field
                  label="Quando"
                  value={new Date(selected.created_at).toLocaleString("pt-BR")}
                />
                <Field label="Despacho" value={selected.dispatch_status} />
                <Field
                  label="Despachado em"
                  value={
                    selected.dispatched_at
                      ? new Date(selected.dispatched_at).toLocaleString("pt-BR")
                      : "—"
                  }
                />
                <Field label="Admins notificados" value={String(selected.admin_count)} />
                <Field
                  label="Canais"
                  value={selected.channels?.length ? selected.channels.join(", ") : "—"}
                />
                <Field label="ID" value={selected.id} mono />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Descrição</div>
                <div className="rounded-md border p-2 bg-muted/30 text-sm whitespace-pre-wrap break-words">
                  {selected.description}
                </div>
              </div>
              {selected.error_message && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Erro de despacho
                  </div>
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs font-mono whitespace-pre-wrap break-words">
                    {selected.error_message}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">Metadata (JSON)</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(JSON.stringify(selected.metadata ?? {}, null, 2))
                        .then(() => toast.success("Metadata copiado."))
                        .catch(() => toast.error("Falha ao copiar."));
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <pre className="rounded-md border bg-muted/40 p-3 text-xs font-mono overflow-x-auto max-h-80">
{JSON.stringify(selected.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs break-all" : "text-sm break-words"}>
        {value}
      </div>
    </div>
  );
}
