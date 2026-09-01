import { memo, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Trophy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_sends: number;
  variant_b_sends: number;
  variant_a_opens: number;
  variant_b_opens: number;
  variant_a_clicks: number;
  variant_b_clicks: number;
  winner?: string | null;
  winner_promoted_at?: string | null;
  min_sample_size?: number | null;
}

interface Props {
  test: ABTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function rate(n: number, d: number) {
  return d > 0 ? (n / d) * 100 : 0;
}

// Z-test para duas proporções + intervalo de confiança 95%
function computeStats(t: ABTest) {
  const nA = Math.max(t.variant_a_sends, 0);
  const nB = Math.max(t.variant_b_sends, 0);
  const pA = nA > 0 ? t.variant_a_opens / nA : 0;
  const pB = nB > 0 ? t.variant_b_opens / nB : 0;
  const pooled = nA + nB > 0 ? (t.variant_a_opens + t.variant_b_opens) / (nA + nB) : 0;
  const se = nA > 0 && nB > 0
    ? Math.sqrt(pooled * (1 - pooled) * (1 / nA + 1 / nB))
    : 0;
  const z = se > 0 ? Math.abs(pA - pB) / se : 0;
  const significant = z >= 1.96;
  const ciA = nA > 0 ? 1.96 * Math.sqrt((pA * (1 - pA)) / nA) * 100 : 0;
  const ciB = nB > 0 ? 1.96 * Math.sqrt((pB * (1 - pB)) / nB) * 100 : 0;
  return { pA: pA * 100, pB: pB * 100, z, significant, ciA, ciB };
}

function ABTestResultsDialogBase({ test, open, onOpenChange }: Props) {
  const stats = useMemo(() => (test ? computeStats(test) : null), [test]);
  const chartData = useMemo(() => {
    if (!test) return [];
    return [
      {
        metric: 'Abertura (%)',
        A: rate(test.variant_a_opens, test.variant_a_sends),
        B: rate(test.variant_b_opens, test.variant_b_sends),
      },
      {
        metric: 'Clique (%)',
        A: rate(test.variant_a_clicks, test.variant_a_opens),
        B: rate(test.variant_b_clicks, test.variant_b_opens),
      },
    ];
  }, [test]);

  if (!test || !stats) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Resultados: {test.name}
          </DialogTitle>
          <DialogDescription>
            Análise estatística das variantes com intervalo de confiança de 95%.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-1">
            <div className="text-xs text-muted-foreground">Variante A</div>
            <div className="font-medium truncate">{test.variant_a_subject}</div>
            <div className="text-sm">
              {test.variant_a_sends} envios · {stats.pA.toFixed(2)}% ± {stats.ciA.toFixed(2)}%
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-1">
            <div className="text-xs text-muted-foreground">Variante B</div>
            <div className="font-medium truncate">{test.variant_b_subject}</div>
            <div className="text-sm">
              {test.variant_b_sends} envios · {stats.pB.toFixed(2)}% ± {stats.ciB.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={stats.significant ? 'default' : 'secondary'} className="gap-1">
            {stats.significant ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            Z = {stats.z.toFixed(2)} · {stats.significant ? 'Significativo (95%)' : 'Sem significância'}
          </Badge>
          {test.winner && (
            <Badge className="bg-yellow-500/20 text-yellow-600">
              <Trophy className="h-3 w-3 mr-1" /> Vencedor: {test.winner}
            </Badge>
          )}
          {test.winner_promoted_at && (
            <Badge variant="outline">Promovido em {new Date(test.winner_promoted_at).toLocaleString('pt-BR')}</Badge>
          )}
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="metric" className="text-xs" />
              <YAxis className="text-xs" unit="%" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(v: number) => `${v.toFixed(2)}%`}
              />
              <Legend />
              <Bar dataKey="A" fill="hsl(var(--primary))" name="Variante A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" fill="hsl(var(--chart-2, 217 91% 60%))" name="Variante B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!stats.significant && (
          <p className="text-xs text-muted-foreground">
            Amostra atual insuficiente para significância. Meta mínima: {test.min_sample_size ?? 30} envios por variante.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const ABTestResultsDialog = memo(ABTestResultsDialogBase);
