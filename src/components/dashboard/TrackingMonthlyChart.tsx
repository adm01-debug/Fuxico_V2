import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { MonthlyTrackingStat } from '@/hooks/use-tracking-monthly-stats';

interface TrackingMonthlyChartProps {
  data: MonthlyTrackingStat[];
  isLoading?: boolean;
  isError?: boolean;
}

export function TrackingMonthlyChart({ data, isLoading, isError }: TrackingMonthlyChartProps) {
  if (isLoading) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground">
        <AlertCircle className="mb-2 h-10 w-10 opacity-50" />
        <p className="text-sm">Não foi possível carregar o histórico mensal</p>
        <p className="text-xs">Recarregue a página para tentar de novo</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground">
        <BarChart3 className="mb-2 h-10 w-10 opacity-50" />
        <p className="text-sm">Sem eventos no período</p>
        <p className="text-xs">
          Aberturas e cliques aparecem aqui quando seus e-mails forem rastreados
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyOpens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="monthlyClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="monthlyBounces" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="opens"
          name="Aberturas"
          stroke="hsl(var(--primary))"
          fillOpacity={1}
          fill="url(#monthlyOpens)"
        />
        <Area
          type="monotone"
          dataKey="clicks"
          name="Cliques"
          stroke="hsl(142, 76%, 36%)"
          fillOpacity={1}
          fill="url(#monthlyClicks)"
        />
        <Area
          type="monotone"
          dataKey="bounces"
          name="Bounces"
          stroke="hsl(0, 72%, 51%)"
          fillOpacity={1}
          fill="url(#monthlyBounces)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
