import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface WeeklyTrendChartProps {
  data: Array<{
    date: string;
    opens: number;
    clicks: number;
    emails: number;
  }>;
  isLoading?: boolean;
}

export function WeeklyTrendChart({ data, isLoading }: WeeklyTrendChartProps) {
  if (isLoading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-sm">Sem dados suficientes</p>
        <p className="text-xs">Envie emails para ver as tendências</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend />
        <Area type="monotone" dataKey="opens" name="Aberturas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorOpens)" />
        <Area type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(142, 76%, 36%)" fillOpacity={1} fill="url(#colorClicks)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
