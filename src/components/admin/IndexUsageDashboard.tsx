// FUXICO — Component: IndexUsageDashboard
// Dashboard de tendência de uso de índices baseado em index_usage_snapshots.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { adminRpc } from '@/lib/admin-rpc';
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
import { BarChart3, Flame, Snowflake, LayoutList } from 'lucide-react';
import { matchFirst } from "@/lib/variant";

type TrendRow = {
  bucket_date: string;
  index_name: string;
  table_name: string;
  total_scans: number;
  avg_size_bytes: number;
  scans_delta: number | null;
};

type RankingRow = {
  index_name: string;
  table_name: string;
  schema_name: string;
  period_scans: number;
  current_size_bytes: number;
  classification: 'hot' | 'warm' | 'cool' | 'cold';
  rank_position: number;
};

type ByTableRow = {
  schema_name: string;
  table_name: string;
  index_count: number;
  total_scans: number;
  total_size_bytes: number;
  cold_indexes: number;
};

const PERIODS = [7, 14, 30, 60, 90] as const;
type Period = (typeof PERIODS)[number];

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function classificationBadge(c: RankingRow['classification']) {
  const map: Record<RankingRow['classification'], string> = {
    hot: 'bg-red-500/15 text-red-500 border-red-500/30',
    warm: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    cool: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
    cold: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
  };
  return (
    <Badge variant="outline" className={map[c]}>
      {c.toUpperCase()}
    </Badge>
  );
}

export function IndexUsageDashboard() {
  const [period, setPeriod] = useState<Period>(30);

  const trend = useQuery({
    queryKey: ['admin_index_usage_trend', period],
    queryFn: () => adminRpc<TrendRow[]>('admin_index_usage_trend', { _days: period, _limit: 10 }),
    staleTime: 60_000,
  });

  const ranking = useQuery({
    queryKey: ['admin_index_ranking', period],
    queryFn: () =>
      adminRpc<RankingRow[]>('admin_index_ranking', { _period_days: period, _limit: 15 }),
    staleTime: 60_000,
  });

  const byTable = useQuery({
    queryKey: ['admin_index_usage_by_table', period],
    queryFn: () => adminRpc<ByTableRow[]>('admin_index_usage_by_table', { _period_days: period }),
    staleTime: 60_000,
  });

  // Pivota trend por índice para o LineChart
  const chartData = useMemo(() => {
    const rows = trend.data ?? [];
    const byDate = new Map<string, Record<string, number | string>>();
    const indexes = new Set<string>();
    for (const r of rows) {
      indexes.add(r.index_name);
      const bucket = byDate.get(r.bucket_date) ?? { bucket_date: r.bucket_date };
      bucket[r.index_name] = Number(r.total_scans);
      byDate.set(r.bucket_date, bucket);
    }
    const data = Array.from(byDate.values()).sort((a, b) =>
      String(a.bucket_date).localeCompare(String(b.bucket_date)),
    );
    return { data, indexes: Array.from(indexes) };
  }, [trend.data]);

  const hotList = useMemo(
    () => (ranking.data ?? []).filter((r) => r.period_scans > 0).slice(0, 15),
    [ranking.data],
  );
  const coldList = useMemo(
    () =>
      (ranking.data ?? [])
        .filter((r) => r.classification === 'cold' || r.classification === 'cool')
        .slice(0, 15),
    [ranking.data],
  );

  // Paleta de cores para as linhas do gráfico
  const palette = [
    'hsl(var(--primary))',
    '#f97316',
    '#22c55e',
    '#eab308',
    '#a855f7',
    '#06b6d4',
    '#ef4444',
    '#10b981',
    '#ec4899',
    '#6366f1',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Uso de índices
            </CardTitle>
            <CardDescription>
              Tendência e ranking dos índices com base nos snapshots semanais.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
              >
                {p}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gráfico de tendência */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold">Tendência — Top 10 índices por scans</h3>
          </div>
          {matchFirst([
  [trend.isLoading, () => ((
            <Skeleton className="h-72 w-full" />
          ))],
  [chartData.data.length === 0, () => ((
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sem dados suficientes para o período selecionado. Aguardando novos snapshots.
            </p>
          ))],
], () => ((
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bucket_date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {chartData.indexes.map((idx, i) => (
                    <Line
                      key={idx}
                      type="monotone"
                      dataKey={idx}
                      stroke={palette[i % palette.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )))}
        </div>

        {/* Rankings lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mais utilizados */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold">Mais utilizados</h3>
            </div>
            {ranking.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Índice</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead className="text-right">Tamanho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hotList.map((r) => (
                      <TableRow key={`hot-${r.index_name}`}>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.rank_position}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div>{r.index_name}</div>
                          <div className="text-muted-foreground text-[10px]">{r.table_name}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {r.period_scans.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBytes(r.current_size_bytes)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {hotList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                          Sem dados no período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Menos utilizados */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Snowflake className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-semibold">Menos utilizados (candidatos a drop)</h3>
            </div>
            {ranking.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Índice</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead className="text-right">Scans</TableHead>
                      <TableHead className="text-right">Tamanho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coldList.map((r) => (
                      <TableRow key={`cold-${r.index_name}`}>
                        <TableCell className="font-mono text-xs">
                          <div>{r.index_name}</div>
                          <div className="text-muted-foreground text-[10px]">{r.table_name}</div>
                        </TableCell>
                        <TableCell>{classificationBadge(r.classification)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {r.period_scans.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatBytes(r.current_size_bytes)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {coldList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                          Nenhum índice ocioso no período. 🎉
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Consumo por tabela */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutList className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Consumo por tabela</h3>
          </div>
          {byTable.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabela</TableHead>
                    <TableHead className="text-right">Índices</TableHead>
                    <TableHead className="text-right">Ociosos</TableHead>
                    <TableHead className="text-right">Scans no período</TableHead>
                    <TableHead className="text-right">Tamanho total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(byTable.data ?? []).slice(0, 20).map((t) => (
                    <TableRow key={`${t.schema_name}.${t.table_name}`}>
                      <TableCell className="font-mono text-xs">
                        {t.schema_name}.{t.table_name}
                      </TableCell>
                      <TableCell className="text-right text-xs">{t.index_count}</TableCell>
                      <TableCell className="text-right text-xs">
                        {t.cold_indexes > 0 ? (
                          <Badge variant="outline" className="bg-slate-500/15 text-slate-500">
                            {t.cold_indexes}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {t.total_scans.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatBytes(t.total_size_bytes)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(byTable.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        Sem dados no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default IndexUsageDashboard;
