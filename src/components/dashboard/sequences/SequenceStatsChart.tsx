import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useSequenceStats } from '@/features/sequences/hooks/useSequenceStats';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SequenceStatsChart() {
  const { data: stats, isLoading } = useSequenceStats(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Inscrições e Respostas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = stats?.map((s: any) => ({
    ...s,
    displayDate: format(parseISO(s.date), 'dd/MM', { locale: ptBR }),
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Evolução de Inscrições e Respostas (últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="enrollments"
                name="Inscrições"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorEnrollments)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="replies"
                name="Respostas"
                stroke="hsl(142, 76%, 36%)"
                fillOpacity={1}
                fill="url(#colorReplies)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
