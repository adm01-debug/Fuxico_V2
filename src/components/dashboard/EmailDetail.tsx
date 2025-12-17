import { useMemo } from "react";
import { useEmailDetail } from "@/hooks/use-tracking";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, MousePointerClick, Clock, Globe, Link2, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrackingEvent } from "@/lib/tracking-api";

interface EmailDetailProps {
  trackingId: string;
  onClose: () => void;
}

function processEventsForChart(events: TrackingEvent[]) {
  if (events.length === 0) return [];

  // Group events by hour
  const grouped = events.reduce((acc, event) => {
    const hour = format(new Date(event.created_at), "dd/MM HH:00");
    if (!acc[hour]) {
      acc[hour] = { time: hour, opens: 0, clicks: 0 };
    }
    if (event.event_type === 'open') {
      acc[hour].opens += 1;
    } else if (event.event_type === 'click') {
      acc[hour].clicks += 1;
    }
    return acc;
  }, {} as Record<string, { time: string; opens: number; clicks: number }>);

  return Object.values(grouped).sort((a, b) => 
    new Date(a.time.split(' ')[0].split('/').reverse().join('-') + 'T' + a.time.split(' ')[1]).getTime() -
    new Date(b.time.split(' ')[0].split('/').reverse().join('-') + 'T' + b.time.split(' ')[1]).getTime()
  );
}

export function EmailDetail({ trackingId, onClose }: EmailDetailProps) {
  const { data, isLoading } = useEmailDetail(trackingId);

  const chartData = useMemo(() => {
    if (!data?.events) return [];
    return processEventsForChart(data.events);
  }, [data?.events]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Email não encontrado
      </div>
    );
  }

  const { email, stats, events, links } = data;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg">Detalhes do Email</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Email Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">{email.recipient_email}</h3>
          <p className="text-muted-foreground">{email.subject || "Sem assunto"}</p>
          <p className="text-sm text-muted-foreground">
            Criado em {format(new Date(email.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Aberturas</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats.totalOpens}</p>
            <p className="text-xs text-muted-foreground">{stats.uniqueOpens} únicos</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-sm font-medium">Cliques</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalClicks}</p>
            <p className="text-xs text-muted-foreground">{stats.uniqueClicks} únicos</p>
          </div>
        </div>

        {/* Activity Chart */}
        {chartData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Atividade ao Longo do Tempo
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="opens"
                    name="Aberturas"
                    stroke="hsl(var(--success))"
                    fillOpacity={1}
                    fill="url(#colorOpens)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Cliques"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Timestamps */}
        {stats.firstOpened && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Primeira abertura:</span>
              <span className="font-medium">
                {format(new Date(stats.firstOpened), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
            {stats.lastOpened && stats.lastOpened !== stats.firstOpened && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Última abertura:</span>
                <span className="font-medium">
                  {format(new Date(stats.lastOpened), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Links Rastreados
            </h4>
            <div className="space-y-2">
              {links.map((link) => (
                <div 
                  key={link.id}
                  className="bg-muted/50 rounded-lg p-3 flex items-center justify-between"
                >
                  <p className="text-sm truncate flex-1 text-muted-foreground">
                    {link.original_url}
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    {link.click_count} cliques
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Timeline */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Histórico de Eventos</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className={`p-1.5 rounded-full ${
                    event.event_type === 'open' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
                  }`}>
                    {event.event_type === 'open' ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <MousePointerClick className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {event.event_type === 'open' ? 'Email aberto' : 'Link clicado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </p>
                    {event.ip_address && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {event.ip_address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
