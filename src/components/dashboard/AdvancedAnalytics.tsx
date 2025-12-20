import { useMemo } from "react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTrackedEmails, useTrackingStats } from "@/hooks/use-tracking";

interface DailyTrend {
  date: string;
  emails: number;
  opens: number;
  clicks: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend 
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : trend === 'down' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                ) : null}
                <span className={
                  trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 
                  'text-muted-foreground'
                }>
                  {change > 0 ? '+' : ''}{change}% vs período anterior
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdvancedAnalytics() {
  const { data: emails, isLoading: emailsLoading } = useTrackedEmails();
  const { data: stats, isLoading: statsLoading } = useTrackingStats();

  // Calculate daily trends
  const dailyTrends = useMemo(() => {
    if (!emails) return [];
    
    const days = eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date(),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEmails = emails.filter(email => {
        const emailDate = new Date(email.created_at);
        return emailDate >= dayStart && emailDate <= dayEnd;
      });

      return {
        date: format(day, 'dd/MM'),
        emails: dayEmails.length,
        opens: 0, // Would need events data
        clicks: 0, // Would need events data
      };
    });
  }, [emails]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    if (!emails) return [];
    
    const distribution: Record<string, number> = {};
    emails.forEach(email => {
      const status = email.delivery_status || 'sent';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name === 'sent' ? 'Enviado' : 
            name === 'delivered' ? 'Entregue' : 
            name === 'bounced' ? 'Rejeitado' : name,
      value,
    }));
  }, [emails]);

  // Calculate hourly distribution
  const hourlyDistribution = useMemo(() => {
    if (!emails) return [];
    
    const hours: number[] = new Array(24).fill(0);
    emails.forEach(email => {
      const hour = new Date(email.created_at).getHours();
      hours[hour]++;
    });

    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}h`,
      count,
    }));
  }, [emails]);

  if (emailsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const openRate = stats && stats.totalEmails > 0 
    ? Math.round((stats.totalOpens / stats.totalEmails) * 100) 
    : 0;

  const clickRate = stats && stats.totalOpens > 0 
    ? Math.round((stats.totalClicks / stats.totalOpens) * 100) 
    : 0;

  const bounceRate = stats && stats.totalEmails > 0 
    ? Math.round((stats.bounced / stats.totalEmails) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Emails"
          value={stats?.totalEmails || 0}
          icon={BarChart3}
        />
        <StatCard
          title="Taxa de Abertura"
          value={`${openRate}%`}
          change={5}
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Taxa de Cliques"
          value={`${clickRate}%`}
          change={-2}
          trend="down"
          icon={Target}
        />
        <StatCard
          title="Taxa de Bounce"
          value={`${bounceRate}%`}
          icon={Activity}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Envios</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="emails"
                  name="Emails"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorEmails)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
            <CardDescription>Status de entrega dos emails</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribuição por Hora
          </CardTitle>
          <CardDescription>Horários de envio mais frequentes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={2}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="count" 
                name="Emails"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedAnalytics;
