import { memo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminRpc } from '@/lib/admin-rpc';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { matchFirst } from '@/lib/variant';

interface DroppedIndexRow {
  id: string;
  schema_name: string;
  table_name: string;
  index_name: string;
  index_size_bytes: number | null;
  index_definition: string | null;
  reason: string | null;
  requested_by: string | null;
  dropped_at: string | null;
  created_at: string;
}

interface RestoreResult {
  ok: boolean;
  drop_id?: string;
  index_name?: string;
  error?: string;
  sqlerrm?: string;
}

function fmtBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return '—';
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

function IndexRestorePanelBase() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState<DroppedIndexRow | null>(null);

  const dropped = useQuery({
    queryKey: ['stale_index_drops', 'dropped'],
    queryFn: async (): Promise<DroppedIndexRow[]> => {
      const { data, error } = await supabase
        .from('stale_index_drops')
        .select(
          'id, schema_name, table_name, index_name, index_size_bytes, index_definition, reason, requested_by, dropped_at, created_at'
        )
        .eq('status', 'dropped')
        .order('dropped_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DroppedIndexRow[];
    },
    staleTime: 60_000,
  });

  const restore = useMutation({
    mutationFn: (id: string) =>
      adminRpc<RestoreResult>('admin_restore_dropped_index', {
        _drop_id: id,
        _requested_by: user?.id ?? null,
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(`Restauração recusada: ${r.error ?? r.sqlerrm ?? 'erro'}`);
        return;
      }
      toast.success(`Índice ${r.index_name ?? ''} recriado com sucesso.`);
      qc.invalidateQueries({ queryKey: ['stale_index_drops'] });
      qc.invalidateQueries({ queryKey: ['admin_stale_indexes'] });
    },
    onError: (e: unknown) =>
      toast.error(`Falha ao restaurar: ${e instanceof Error ? e.message : 'erro desconhecido'}`),
  });

  const rows = dropped.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" /> Restaurar índice removido
        </CardTitle>
        <CardDescription>
          Índices removidos nos últimos ciclos, com a definição original preservada para recriação.{' '}
          <code>admin_restore_dropped_index</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matchFirst(
          [
            [
              dropped.isError,
              () => (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Erro ao listar índices removidos:{' '}
                  {dropped.error instanceof Error ? dropped.error.message : 'erro desconhecido'}
                </div>
              ),
            ],
            [dropped.isLoading, () => <Skeleton className="h-32 w-full" />],
            [
              rows.length === 0,
              () => (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum índice removido aguardando restauração.
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
                    <TableHead className="text-right">Tamanho</TableHead>
                    <TableHead>Removido em</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.index_name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.schema_name}.{r.table_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtBytes(r.index_size_bytes)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtWhen(r.dropped_at)}
                      </TableCell>
                      <TableCell className="text-xs">{r.reason ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={restore.isPending || !user?.id}
                          onClick={() => setConfirming(r)}
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Recriar {confirming?.index_name}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>
                  O índice voltará a existir em <code>{confirming?.schema_name}</code>.
                  <code>{confirming?.table_name}</code> ocupando{' '}
                  {fmtBytes(confirming?.index_size_bytes ?? null)}. A recriação disputa lock com
                  escritas na tabela — em tabelas grandes isso pode segurar gravações por alguns
                  segundos.
                </p>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {confirming?.index_definition ?? 'CREATE INDEX ...'}
                </pre>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-primary')}
              onClick={() => {
                if (!confirming) return;
                restore.mutate(confirming.id);
                setConfirming(null);
              }}
            >
              Recriar índice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export const IndexRestorePanel = memo(IndexRestorePanelBase);
