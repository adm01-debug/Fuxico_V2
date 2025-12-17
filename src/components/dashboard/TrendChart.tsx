import { useTrackingTrends } from "@/hooks/use-tracking-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function TrendChart() {
  const { data: weekData, isLoading: weekLoading } = useTrackingTrends(7);
  const { data: monthData, isLoading: monthLoading } = useTrackingTrends(30);

  const renderChart = (data: typeof weekData, isLoading: boolean) => {
    if (isLoading) {
      return <Skeleton className="h-[250px] w-full" />;
    }

    if (!data?.length || data.every(d => d.opens === 0 && d.clicks === 0)) {
      return (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível para este período
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
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
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-popover border rounded-lg shadow-lg p-3">
                  <p className="font-medium text-sm mb-1">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                      {entry.name === 'opens' ? 'Aberturas' : 'Cliques'}: {entry.value}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="opens"
            name="opens"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorOpens)"
          />
          <Area
            type="monotone"
            dataKey="clicks"
            name="clicks"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#colorClicks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tendências de Engajamento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week">
          <TabsList className="mb-4">
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">30 dias</TabsTrigger>
          </TabsList>
          <TabsContent value="week">
            {renderChart(weekData, weekLoading)}
          </TabsContent>
          <TabsContent value="month">
            {renderChart(monthData, monthLoading)}
          </TabsContent>
        </Tabs>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Aberturas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-muted-foreground">Cliques</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
