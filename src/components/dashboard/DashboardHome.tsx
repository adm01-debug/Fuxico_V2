import { log } from '@/lib/logger';
// =============================================================================
// FUXICO - Dashboard Home Consolidado
// Componente: src/components/dashboard/DashboardHome.tsx
// Descrição: Página inicial com métricas, eventos em tempo real e alertas
// =============================================================================

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  MousePointerClick,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Users,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import { RealtimeMetrics } from './RealtimeMetrics';
import { useTrackingStats, useTrackedEmails, useRefreshStats } from '@/hooks/use-tracking';
import { useTrackingTrends } from '@/hooks/use-tracking-trends';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

// =============================================================================
// TIPOS
// =============================================================================

interface RealtimeEvent {
  id: string;
  type: 'open' | 'click' | 'bounce' | 'document_view';
  email: string;
  subject?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface BounceAlert {
  id: string;
  email: string;
  subject?: string;
  type: string;
  reason?: string;
  timestamp: string;
}

// =============================================================================
// COMPONENTES DE MÉTRICAS
// =============================================================================

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  className?: string;
}

function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  trend = 'neutral',
  isLoading,
  className = '',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card role="region" aria-label="Estatísticas" className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-label="Estatísticas" className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                <span className={`text-sm ${
                  trend === 'up' ? 'text-green-500' : 
                  trend === 'down' ? 'text-red-500' : 
                  'text-muted-foreground'
                }`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPONENTE DE EVENTOS EM TEMPO REAL
// =============================================================================

interface RealtimeEventsProps {
  events: RealtimeEvent[];
  isLoading?: boolean;
}

function RealtimeEvents({ events, isLoading }: RealtimeEventsProps) {
  const getEventIcon = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'open':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'click':
        return <MousePointerClick className="h-4 w-4 text-green-500" />;
      case 'bounce':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'document_view':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEventLabel = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'open':
        return 'Abertura';
      case 'click':
        return 'Clique';
      case 'bounce':
        return 'Bounce';
      case 'document_view':
        return 'Documento';
      default:
        return 'Evento';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 xl:p-4 xl:gap-4 bg-muted/50 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Zap className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhum evento recente</p>
        <p className="text-xs">Eventos aparecerão aqui em tempo real</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px]">
      <div className="space-y-2 pr-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 xl:p-4 xl:gap-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.email}</p>
              {event.subject && (
                <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs">
                {getEventLabel(event.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.timestamp), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// =============================================================================
// COMPONENTE DE ALERTAS DE BOUNCE
// =============================================================================

interface BounceAlertsProps {
  alerts: BounceAlert[];
  isLoading?: boolean;
}

function BounceAlerts({ alerts, isLoading }: BounceAlertsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 xl:p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-600">Nenhum bounce recente</p>
        <p className="text-xs">Seus emails estão sendo entregues corretamente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2 pr-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 xl:p-4 border border-destructive/20 bg-destructive/5 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.email}</p>
                {alert.subject && (
                  <p className="text-xs text-muted-foreground truncate">{alert.subject}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    {alert.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
                {alert.reason && (
                  <p className="text-xs text-destructive/80 mt-1 truncate">{alert.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// =============================================================================
// COMPONENTE DE GRÁFICO DE TENDÊNCIA
// =============================================================================

interface WeeklyTrendChartProps {
  data: Array<{
    date: string;
    opens: number;
    clicks: number;
    emails: number;
  }>;
  isLoading?: boolean;
}

function WeeklyTrendChart({ data, isLoading }: WeeklyTrendChartProps) {
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
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fontSize: 12 }} 
          className="text-muted-foreground"
        />
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
          fill="url(#colorOpens)"
        />
        <Area
          type="monotone"
          dataKey="clicks"
          name="Cliques"
          stroke="hsl(142, 76%, 36%)"
          fillOpacity={1}
          fill="url(#colorClicks)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function DashboardHome() {
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [bounceAlerts, setBounceAlerts] = useState<BounceAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: stats, isLoading: isLoadingStats } = useTrackingStats();
  const { data: emails, isLoading: isLoadingEmails } = useTrackedEmails({ limit: 50 });
  const { data: trends, isLoading: isLoadingTrends } = useTrackingTrends(7);
  const { refresh } = useRefreshStats();

  // Calcular métricas derivadas
  const metrics = useMemo(() => {
    if (!stats) {
      return {
        totalEmails: 0,
        totalOpens: 0,
        totalClicks: 0,
        bounceRate: 0,
        openRate: 0,
        clickRate: 0,
      };
    }

    return {
      totalEmails: stats.totalEmails || 0,
      totalOpens: stats.totalOpens || 0,
      totalClicks: stats.totalClicks || 0,
      bounceRate: stats.bounceRate || 0,
      openRate: stats.openRate || 0,
      clickRate: stats.clickRate || 0,
    };
  }, [stats]);

  // Preparar dados do gráfico
  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];

    return trends.map((day) => ({
      date: format(new Date(day.date), 'dd/MM', { locale: ptBR }),
      opens: day.opens,
      clicks: day.clicks,
      emails: 0,
    }));
  }, [trends]);

  // Calcular sumário das tendências
  const trendsSummary = useMemo(() => {
    if (!trends || trends.length === 0) return null;
    
    const totalOpens = trends.reduce((sum, d) => sum + d.opens, 0);
    const totalClicks = trends.reduce((sum, d) => sum + d.clicks, 0);
    
    return {
      totalOpens,
      totalClicks,
      totalLinks: 0,
      avgTimeToOpen: null as number | null,
    };
  }, [trends]);

  // Carregar eventos recentes e bounces
  useEffect(() => {
    async function loadRecentData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar eventos recentes
        const { data: events } = await supabase
          .from('tracking_events')
          .select(`
            id,
            event_type,
            created_at,
            tracking_id,
            tracked_emails!inner(recipient_email, subject, user_id)
          `)
          .eq('tracked_emails.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (events) {
          const formattedEvents: RealtimeEvent[] = events.map((e: any) => ({
            id: e.id,
            type: e.event_type as RealtimeEvent['type'],
            email: e.tracked_emails?.recipient_email || 'N/A',
            subject: e.tracked_emails?.subject,
            timestamp: e.created_at,
          }));
          setRealtimeEvents(formattedEvents);
        }

        // Buscar bounces recentes
        const { data: bounces } = await supabase
          .from('tracked_emails')
          .select('id, recipient_email, subject, bounce_type, bounce_reason, bounce_detected_at')
          .eq('user_id', user.id)
          .eq('delivery_status', 'bounced')
          .not('bounce_detected_at', 'is', null)
          .order('bounce_detected_at', { ascending: false })
          .limit(10);

        if (bounces) {
          const formattedBounces: BounceAlert[] = bounces.map((b) => ({
            id: b.id,
            email: b.recipient_email,
            subject: b.subject || undefined,
            type: b.bounce_type || 'unknown',
            reason: b.bounce_reason || undefined,
            timestamp: b.bounce_detected_at!,
          }));
          setBounceAlerts(formattedBounces);
        }
      } catch (error) {
        log.error('Error loading recent data:', error);
      }
    }

    loadRecentData();
  }, []);

  // Configurar listener de eventos em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracking_events',
        },
        async (payload) => {
          // Buscar dados do email relacionado
          const { data: email } = await supabase
            .from('tracked_emails')
            .select('recipient_email, subject')
            .eq('tracking_id', payload.new.tracking_id)
            .single();

          if (email) {
            const newEvent: RealtimeEvent = {
              id: payload.new.id,
              type: payload.new.event_type as RealtimeEvent['type'],
              email: email.recipient_email,
              subject: email.subject || undefined,
              timestamp: payload.new.created_at,
            };

            setRealtimeEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground">
            Acompanhe suas métricas e eventos em tempo real
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <section 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6"
        data-tour="stats-cards"
      >
        <MetricCard
          title="Total de Emails"
          value={metrics.totalEmails.toLocaleString('pt-BR')}
          icon={<Mail className="h-6 w-6 text-primary" />}
          isLoading={isLoadingStats}
        />
        <MetricCard
          title="Aberturas"
          value={metrics.totalOpens.toLocaleString('pt-BR')}
          change={metrics.openRate}
          changeLabel="taxa"
          icon={<Eye className="h-6 w-6 text-blue-500" />}
          trend={metrics.openRate > 20 ? 'up' : metrics.openRate < 10 ? 'down' : 'neutral'}
          isLoading={isLoadingStats}
        />
        <MetricCard
          title="Cliques"
          value={metrics.totalClicks.toLocaleString('pt-BR')}
          change={metrics.clickRate}
          changeLabel="taxa"
          icon={<MousePointerClick className="h-6 w-6 text-green-500" />}
          trend={metrics.clickRate > 5 ? 'up' : metrics.clickRate < 2 ? 'down' : 'neutral'}
          isLoading={isLoadingStats}
        />
        <MetricCard
          title="Taxa de Bounce"
          value={`${metrics.bounceRate.toFixed(1)}%`}
          icon={<AlertTriangle className="h-6 w-6 text-orange-500" />}
          trend={metrics.bounceRate < 2 ? 'up' : metrics.bounceRate > 5 ? 'down' : 'neutral'}
          isLoading={isLoadingStats}
        />
      </section>

      {/* Métricas em Tempo Real */}
      <section data-tour="realtime-metrics">
        <RealtimeMetrics />
      </section>

      {/* Grid Principal */}
      <section className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-8">
        {/* Gráfico de Tendência */}
        <Card role="region" aria-label="Estatísticas" className="lg:col-span-2" data-tour="trend-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência Semanal
            </CardTitle>
            <CardDescription>
              Aberturas e cliques nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyTrendChart data={chartData} isLoading={isLoadingTrends} />
          </CardContent>
        </Card>

        {/* Eventos em Tempo Real */}
        <Card data-tour="realtime-events">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Atividade em Tempo Real
            </CardTitle>
            <CardDescription>
              Últimos eventos de tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RealtimeEvents 
              events={realtimeEvents} 
              isLoading={isLoadingEmails} 
            />
          </CardContent>
        </Card>
      </section>

      {/* Alertas de Bounce */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertas de Bounce
          </CardTitle>
          <CardDescription>
            Emails que não foram entregues recentemente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BounceAlerts alerts={bounceAlerts} isLoading={isLoadingEmails} />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card role="region" aria-label="Estatísticas" className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destinatários Únicos</p>
                <p className="text-2xl font-bold">
                  {emails 
                    ? new Set(emails.map(e => e.recipient_email)).size.toLocaleString('pt-BR')
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card role="region" aria-label="Estatísticas" className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aberturas (7 dias)</p>
                <p className="text-2xl font-bold">
                  {trendsSummary?.totalOpens?.toLocaleString('pt-BR') || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card role="region" aria-label="Estatísticas" className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MousePointerClick className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliques (7 dias)</p>
                <p className="text-2xl font-bold">
                  {trendsSummary?.totalClicks?.toLocaleString('pt-BR') || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
