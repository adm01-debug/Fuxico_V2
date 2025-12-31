import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RateLimitLog {
  id: string;
  ip_address: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end: string;
  is_blocked: boolean;
  created_at: string;
}

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topEndpoints: { endpoint: string; count: number }[];
  hourlyData: { hour: string; requests: number; blocked: number }[];
}

export default function RateLimitDashboard() {
  // Fetch rate limit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['rateLimitLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_limit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as RateLimitLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate stats
  const stats: RateLimitStats = (() => {
    if (!logs?.length) {
      return {
        totalRequests: 0,
        blockedRequests: 0,
        uniqueIPs: 0,
        topEndpoints: [],
        hourlyData: [],
      };
    }

    const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;
    const totalRequests = logs.reduce((sum, l) => sum + l.request_count, 0);
    const blockedRequests = logs.filter(l => l.is_blocked).length;

    // Top endpoints
    const endpointCounts = logs.reduce((acc, l) => {
      acc[l.endpoint] = (acc[l.endpoint] || 0) + l.request_count;
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Hourly data
    const hourlyMap = new Map<string, { requests: number; blocked: number }>();
    logs.forEach(l => {
      const hour = new Date(l.created_at).getHours().toString().padStart(2, '0') + ':00';
      const existing = hourlyMap.get(hour) || { requests: 0, blocked: 0 };
      existing.requests += l.request_count;
      if (l.is_blocked) existing.blocked++;
      hourlyMap.set(hour, existing);
    });

    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return { totalRequests, blockedRequests, uniqueIPs, topEndpoints, hourlyData };
  })();

  const blockRate = stats.totalRequests > 0 
    ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Requisições (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.blockedRequests}</p>
                <p className="text-xs text-muted-foreground">Bloqueadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Bloqueio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueIPs}</p>
                <p className="text-xs text-muted-foreground">IPs Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Requests over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requisições por Hora</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary)/0.2)" 
                    name="Requisições"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="blocked" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive)/0.2)" 
                    name="Bloqueadas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Endpoints</CardTitle>
            <CardDescription>Mais acessados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : stats.topEndpoints.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topEndpoints} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    dataKey="endpoint" 
                    type="category" 
                    width={120}
                    className="text-xs"
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="Requisições"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent blocked */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisições Bloqueadas Recentes</CardTitle>
          <CardDescription>Últimas tentativas bloqueadas por rate limit</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {logs?.filter(l => l.is_blocked).slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <div>
                      <p className="font-mono text-sm">{log.ip_address}</p>
                      <p className="text-xs text-muted-foreground">{log.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{log.request_count} req</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {logs?.filter(l => l.is_blocked).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma requisição bloqueada recentemente
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
