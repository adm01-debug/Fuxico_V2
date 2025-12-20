import { useState, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown,
  GitCompareArrows,
  BarChart3, 
  Activity,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  Smartphone,
  Monitor,
  Users,
  Zap,
  Mail,
  MousePointerClick,
  Timer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useTrackedEmails, useTrackingStats, useEngagementMetrics } from "@/hooks/use-tracking";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface DateRange {
  from: Date;
  to: Date;
}

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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const { data: emails, isLoading: emailsLoading } = useTrackedEmails();
  const { data: stats, isLoading: statsLoading } = useTrackingStats();

  // Filter emails by date range
  const filteredEmails = useMemo(() => {
    if (!emails) return [];
    
    return emails.filter(email => {
      const emailDate = new Date(email.created_at);
      return isWithinInterval(emailDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
    });
  }, [emails, dateRange]);

  // Calculate daily trends
  const dailyTrends = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEmails = filteredEmails.filter(email => {
        const emailDate = new Date(email.created_at);
        return emailDate >= dayStart && emailDate <= dayEnd;
      });

      return {
        date: format(day, 'dd/MM'),
        emails: dayEmails.length,
        opens: 0,
        clicks: 0,
      };
    });
  }, [filteredEmails, dateRange]);

  // Calculate previous period for comparison
  const periodLength = differenceInDays(dateRange.to, dateRange.from) + 1;
  
  const previousPeriodEmails = useMemo(() => {
    if (!emails) return [];
    
    const previousFrom = subDays(dateRange.from, periodLength);
    const previousTo = subDays(dateRange.from, 1);
    
    return emails.filter(email => {
      const emailDate = new Date(email.created_at);
      return isWithinInterval(emailDate, {
        start: startOfDay(previousFrom),
        end: endOfDay(previousTo),
      });
    });
  }, [emails, dateRange, periodLength]);

  // Comparison data for chart
  const comparisonData = useMemo(() => {
    const currentDays = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    return currentDays.map((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const currentCount = filteredEmails.filter(email => {
        const emailDate = new Date(email.created_at);
        return emailDate >= dayStart && emailDate <= dayEnd;
      }).length;

      // Get corresponding day from previous period
      const previousDay = subDays(day, periodLength);
      const prevDayStart = startOfDay(previousDay);
      const prevDayEnd = endOfDay(previousDay);
      
      const previousCount = previousPeriodEmails.filter(email => {
        const emailDate = new Date(email.created_at);
        return emailDate >= prevDayStart && emailDate <= prevDayEnd;
      }).length;

      return {
        day: `Dia ${index + 1}`,
        date: format(day, 'dd/MM'),
        atual: currentCount,
        anterior: previousCount,
      };
    });
  }, [filteredEmails, previousPeriodEmails, dateRange, periodLength]);

  // Calculate period comparison stats
  const periodComparison = useMemo(() => {
    const currentTotal = filteredEmails.length;
    const previousTotal = previousPeriodEmails.length;
    
    const change = previousTotal > 0 
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : currentTotal > 0 ? 100 : 0;
    
    return {
      currentTotal,
      previousTotal,
      change,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' as 'up' | 'down' | 'neutral',
    };
  }, [filteredEmails, previousPeriodEmails]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredEmails.forEach(email => {
      const status = email.delivery_status || 'sent';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name === 'sent' ? 'Enviado' : 
            name === 'delivered' ? 'Entregue' : 
            name === 'bounced' ? 'Rejeitado' : name,
      value,
    }));
  }, [filteredEmails]);

  // Calculate hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hours: number[] = new Array(24).fill(0);
    filteredEmails.forEach(email => {
      const hour = new Date(email.created_at).getHours();
      hours[hour]++;
    });

    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}h`,
      count,
    }));
  }, [filteredEmails]);

  // Preset date ranges
  const setPresetRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

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

  const totalFiltered = filteredEmails.length;
  const openRate = totalFiltered > 0 
    ? Math.round((stats?.totalOpens || 0) / totalFiltered * 100) 
    : 0;

  const clickRate = stats && stats.totalOpens > 0 
    ? Math.round((stats.totalClicks / stats.totalOpens) * 100) 
    : 0;

  const bounceRate = totalFiltered > 0 
    ? Math.round((filteredEmails.filter(e => e.bounce_type).length / totalFiltered) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange(7)}
                  className={cn(
                    dateRange.from.getTime() === subDays(new Date(), 7).setHours(0,0,0,0) && "bg-primary text-primary-foreground"
                  )}
                >
                  7 dias
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange(30)}
                  className={cn(
                    dateRange.from.getTime() === subDays(new Date(), 30).setHours(0,0,0,0) && "bg-primary text-primary-foreground"
                  )}
                >
                  30 dias
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPresetRange(90)}
                >
                  90 dias
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    disabled={(date) => date > dateRange.to || date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">até</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    disabled={(date) => date < dateRange.from || date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Badge variant="secondary" className="ml-auto">
              {totalFiltered} emails no período
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Emails"
          value={totalFiltered}
          change={periodComparison.change}
          trend={periodComparison.trend}
          icon={BarChart3}
        />
        <StatCard
          title="Taxa de Abertura"
          value={`${openRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Taxa de Cliques"
          value={`${clickRate}%`}
          icon={Target}
        />
        <StatCard
          title="Taxa de Bounce"
          value={`${bounceRate}%`}
          icon={Activity}
        />
      </div>

      {/* Period Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5" />
            Comparação de Períodos
          </CardTitle>
          <CardDescription>
            Período atual ({format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}) 
            vs Período anterior ({format(subDays(dateRange.from, periodLength), "dd/MM", { locale: ptBR })} - {format(subDays(dateRange.from, 1), "dd/MM", { locale: ptBR })})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Período Atual: {periodComparison.currentTotal} emails
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              Período Anterior: {periodComparison.previousTotal} emails
            </Badge>
            <Badge 
              variant={periodComparison.change >= 0 ? "default" : "destructive"}
              className="ml-auto"
            >
              {periodComparison.change > 0 ? '+' : ''}{periodComparison.change}% variação
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={comparisonData}>
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
                formatter={(value: number, name: string) => [
                  value,
                  name === 'atual' ? 'Período Atual' : 'Período Anterior'
                ]}
              />
              <Legend 
                formatter={(value) => value === 'atual' ? 'Período Atual' : 'Período Anterior'}
              />
              <Line
                type="monotone"
                dataKey="atual"
                name="atual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="anterior"
                name="anterior"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: 'hsl(var(--muted-foreground))' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Envios</CardTitle>
            <CardDescription>
              {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </CardDescription>
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

      {/* Engagement Metrics Section */}
      <EngagementMetricsSection />
    </div>
  );
}

// Engagement Metrics Component
function EngagementMetricsSection() {
  const { data: engagement, isLoading } = useEngagementMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!engagement) return null;

  const { summary, devices, topEmails, emails } = engagement;

  const deviceData = [
    { name: 'Desktop', value: devices.desktop, icon: Monitor },
    { name: 'Mobile', value: devices.mobile, icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Métricas de Engajamento</h2>
      </div>

      {/* Engagement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                <p className="text-2xl font-bold">{summary.openRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {summary.emailsWithOpens} de {summary.totalEmails} emails
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Cliques</p>
                <p className="text-2xl font-bold">{summary.clickRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {summary.emailsWithClicks} emails com cliques
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média de Aberturas</p>
                <p className="text-2xl font-bold">{summary.avgOpensPerEmail}</p>
                <p className="text-xs text-muted-foreground">por email</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Timer className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo até Abertura</p>
                <p className="text-2xl font-bold">
                  {summary.avgTimeToOpen !== null ? `${summary.avgTimeToOpen}min` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown & Top Emails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispositivos</CardTitle>
            <CardDescription>Onde seus emails são abertos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceData.map((device) => {
              const total = devices.mobile + devices.desktop;
              const percentage = total > 0 ? Math.round((device.value / total) * 100) : 0;
              const DeviceIcon = device.icon;
              
              return (
                <div key={device.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {device.value} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de aberturas</span>
                <span className="font-medium">{devices.mobile + devices.desktop}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Emails */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Emails por Engajamento</CardTitle>
            <CardDescription>Emails com melhor performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEmails.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado de engajamento disponível
                </p>
              ) : (
                topEmails.map((email, index) => (
                  <div key={email.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      index === 1 ? "bg-gray-300/30 text-gray-600" :
                      index === 2 ? "bg-orange-500/20 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {email.subject || 'Sem assunto'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.recipientEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{email.opens}</span>
                        <MousePointerClick className="h-3 w-3 ml-2" />
                        <span>{email.clicks}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Score: {email.engagementScore}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Email Engagement Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engajamento Detalhado por Email</CardTitle>
          <CardDescription>Métricas individuais de cada email rastreado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="text-center">Aberturas</TableHead>
                  <TableHead className="text-center">Únicas</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-center">Tempo</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.slice(0, 10).map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {email.recipientEmail}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {email.subject || <span className="text-muted-foreground">Sem assunto</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={email.opens > 0 ? "default" : "secondary"}>
                        {email.opens}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {email.uniqueOpens}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={email.clicks > 0 ? "default" : "secondary"}>
                        {email.clicks}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {email.timeToFirstOpen !== null ? `${email.timeToFirstOpen}min` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                        email.engagementScore >= 10 ? "bg-green-500/20 text-green-600" :
                        email.engagementScore >= 5 ? "bg-yellow-500/20 text-yellow-600" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {email.engagementScore}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {emails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum email rastreado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {emails.length > 10 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Mostrando 10 de {emails.length} emails
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedAnalytics;
