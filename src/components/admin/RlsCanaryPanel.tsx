import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, MinusCircle, Play, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminRpc } from '@/lib/admin-rpc';
import { matchFirst } from '@/lib/variant';

/** Linha de admin_rls_canary_full(): SELECT e escrita em tabelas com RLS. */
interface CanaryRow {
  test_type: string;
  target: string;
  operation: string;
  passed: boolean;
  detail: string | null;
}

type RowState = 'ok' | 'failed' | 'skipped';

/**
 * `passed` sozinho engana: quando o canary não consegue montar o cenário
 * (poucos usuários, seed bloqueado por NOT NULL, tabela vazia) ele não falha,
 * apenas não testa. Tratamos isso como "não executado".
 */
function rowState(row: CanaryRow): RowState {
  const detail = row.detail ?? '';
  if (!row.passed) return 'failed';
  if (row.target === 'skipped') return 'skipped';
  if (detail.startsWith('seed_skipped')) return 'skipped';
  if (detail.startsWith('tabelas auditadas: 0')) return 'skipped';
  return 'ok';
}

function StateBadge({ state }: { state: RowState }) {
  return matchFirst(
    [
      [
        state === 'failed',
        () => (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            FALHOU
          </Badge>
        ),
      ],
      [
        state === 'skipped',
        () => (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            NÃO EXECUTADO
          </Badge>
        ),
      ],
    ],
    () => (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        OK
      </Badge>
    )
  );
}

function OverallBadge({ ok, failed, skipped }: { ok: number; failed: number; skipped: number }) {
  return matchFirst(
    [
      [
        failed > 0,
        () => (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            {failed} FALHA{failed > 1 ? 'S' : ''}
          </Badge>
        ),
      ],
      [
        skipped > 0 && ok === 0,
        () => (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            SEM COBERTURA
          </Badge>
        ),
      ],
      [
        skipped > 0,
        () => (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            PARCIAL
          </Badge>
        ),
      ],
    ],
    () => (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        OK
      </Badge>
    )
  );
}

export function RlsCanaryPanel() {
  const canary = useMutation({
    mutationFn: () => adminRpc<CanaryRow[]>('admin_rls_canary_full'),
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Falha ao executar a auditoria de RLS');
    },
  });

  const rows = canary.data ?? [];
  const states = rows.map(rowState);
  const okCount = states.filter((s) => s === 'ok').length;
  const failedCount = states.filter((s) => s === 'failed').length;
  const skippedCount = states.filter((s) => s === 'skipped').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Auditoria de RLS
            </CardTitle>
            <CardDescription>
              Le e escreve como usuário comum para confirmar que as policies bloqueiam o que
              deveriam. Tudo roda em transação com rollback. <code>admin_rls_canary_full</code>
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={canary.isPending}
            onClick={() => canary.mutate()}
          >
            <Play className="mr-1 h-4 w-4" />
            {canary.isPending ? 'Executando...' : 'Executar auditoria'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {matchFirst(
          [
            [
              canary.isError,
              () => (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Erro ao executar a auditoria:{' '}
                  {canary.error instanceof Error ? canary.error.message : 'erro desconhecido'}
                </div>
              ),
            ],
            [
              canary.isPending,
              () => (
                <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 animate-pulse" />
                  Rodando canary de leitura e escrita...
                </div>
              ),
            ],
            [
              !canary.data,
              () => (
                <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                  <MinusCircle className="h-4 w-4" />
                  Nenhuma auditoria executada nesta sessão.
                </div>
              ),
            ],
            [
              rows.length === 0,
              () => (
                <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                  <MinusCircle className="h-4 w-4" />A função não retornou nenhum teste.
                </div>
              ),
            ],
          ],
          () => (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <OverallBadge ok={okCount} failed={failedCount} skipped={skippedCount} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {okCount} testados
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MinusCircle className="h-3 w-3 text-amber-500" /> {skippedCount} não executados
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <XCircle className="h-3 w-3 text-destructive" /> {failedCount} falhas
                </span>
              </div>
              {skippedCount > 0 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                  Testes marcados como NÃO EXECUTADO não provam que a RLS está correta: o canary não
                  conseguiu montar o cenário (dados de teste ausentes ou tabela vazia).
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Teste</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead className="w-24">Operação</TableHead>
                      <TableHead className="w-36">Estado</TableHead>
                      <TableHead>Detalhe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={`${r.test_type}-${r.target}-${r.operation}-${i}`}>
                        <TableCell className="text-xs uppercase text-muted-foreground">
                          {r.test_type}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.target}</TableCell>
                        <TableCell className="text-xs">{r.operation}</TableCell>
                        <TableCell>
                          <StateBadge state={rowState(r)} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.detail ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
