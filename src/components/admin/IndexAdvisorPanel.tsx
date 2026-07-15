import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRpc } from '@/lib/admin-rpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lightbulb, Play } from 'lucide-react';
import { toast } from 'sonner';

type Run = {
  id: string;
  ran_at: string;
  high_count: number;
  medium_count: number;
  triggered_by: string;
  details: Array<{
    table_name?: string;
    severity?: string;
    reason?: string;
    seq_scan?: number;
    idx_scan?: number;
    live_tuples?: number;
  }>;
};

export function IndexAdvisorPanel() {
  const qc = useQueryClient();

  const runs = useQuery({
    queryKey: ['admin_list_index_advisor_runs'],
    queryFn: () => adminRpc<Run[]>('admin_list_index_advisor_runs', { _limit: 20 }),
    staleTime: 60_000,
  });

  const runNow = useMutation({
    mutationFn: () => adminRpc<{ high_count: number; medium_count: number }>('admin_run_index_advisor'),
    onSuccess: (data) => {
      toast.success(
        `Advisor executado: ${data.high_count} HIGH · ${data.medium_count} MEDIUM`,
      );
      qc.invalidateQueries({ queryKey: ['admin_list_index_advisor_runs'] });
    },
    onError: (e: unknown) => {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    },
  });

  const latest = runs.data?.[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> Index Advisor
          </CardTitle>
          <CardDescription>
            Recomendações diárias de índices baseadas em uso de seq scan. Cron: 03:15 UTC.
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={runNow.isPending}
          onClick={() => runNow.mutate()}
        >
          <Play className="w-4 h-4 mr-2" />
          {runNow.isPending ? 'Executando...' : 'Executar agora'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {runs.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !runs.data || runs.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma execução registrada ainda. Clique em "Executar agora" para gerar o primeiro relatório.
          </p>
        ) : (
          <>
            {latest && (latest.high_count > 0 || latest.medium_count > 0) && (
              <div className="rounded-md border p-3 bg-muted/30">
                <div className="text-xs font-semibold mb-2">
                  Última execução — {new Date(latest.ran_at).toLocaleString('pt-BR')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {latest.details.slice(0, 20).map((d, i) => (
                    <div key={i} className="text-xs rounded border p-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono truncate">{d.table_name}</div>
                        <div className="text-muted-foreground">{d.reason}</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          d.severity === 'HIGH'
                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }
                      >
                        {d.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">HIGH</TableHead>
                    <TableHead className="text-right">MEDIUM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.ran_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.triggered_by}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            r.high_count > 0
                              ? 'bg-destructive/15 text-destructive border-destructive/30'
                              : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          }
                        >
                          {r.high_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            r.medium_count > 0
                              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          }
                        >
                          {r.medium_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
