import { log } from '@/lib/logger';
// =============================================================================
// FUXICO - Dashboard Home Consolidado
// Componente: src/components/dashboard/DashboardHome.tsx
// Descrição: Página inicial com métricas, eventos em tempo real e alertas
// =============================================================================

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { cn } from '@/lib/utils';
import { RealtimeMetrics } from './RealtimeMetrics';
import { QuickActions } from './QuickActions';
import { PerformanceGauge } from './PerformanceGauge';
import { WidgetCustomizer } from './WidgetCustomizer';
import { DraggableWidgetGrid, AnimatedWidgetCard } from './DraggableWidgetGrid';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/use-dashboard-widgets';
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
  gradient?: string;
  sparklineData?: number[];
}

// Sparkline mini chart
function MiniSparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const padding = 2;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill="url(#sparklineGradient)"
      />
    </svg>
  );
}

// Animated number counter
function AnimatedNumber({ value, className }: { value: number | string; className?: string }) {
  return (
    <motion.span
      key={value.toString()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
    </motion.span>
  );
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
  gradient,
  sparklineData,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';
  const trendBg = trend === 'up' ? 'bg-emerald-500/10' : trend === 'down' ? 'bg-red-500/10' : 'bg-muted';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        role="region" 
        aria-label="Estatísticas" 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20',
          className
        )}
      >
        {/* Gradient background on hover */}
        <AnimatePresence>
          {isHovered && gradient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              exit={{ opacity: 0 }}
              className={cn('absolute inset-0 bg-gradient-to-br', gradient)}
            />
          )}
        </AnimatePresence>

        <CardContent className="pt-6 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {title}
                {sparklineData && sparklineData.length > 0 && (
                  <MiniSparkline 
                    data={sparklineData} 
                    color={trend === 'up' ? 'hsl(142, 76%, 36%)' : trend === 'down' ? 'hsl(0, 84%, 60%)' : 'hsl(var(--primary))'} 
                  />
                )}
              </p>
              <div className="mt-2">
                <AnimatedNumber 
                  value={value} 
                  className="text-3xl font-bold tracking-tight" 
                />
              </div>
              {change !== undefined && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 mt-2"
                >
                  <span className={cn('flex items-center gap-0.5 text-sm font-medium px-1.5 py-0.5 rounded-md', trendBg, trendColor)}>
                    {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                    {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5" />}
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                  {changeLabel && (
                    <span className="text-xs text-muted-foreground">{changeLabel}</span>
                  )}
                </motion.div>
              )}
            </div>
            
            {/* Icon container with gradient */}
            <motion.div 
              animate={{ 
                rotate: isHovered ? [0, -5, 5, 0] : 0,
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shadow-lg",
                gradient ? `bg-gradient-to-br ${gradient} text-white` : 'bg-primary/10'
              )}
            >
              {icon}
            </motion.div>
          </div>
        </CardContent>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5 origin-left',
            gradient ? `bg-gradient-to-r ${gradient}` : 'bg-primary'
          )}
        />
      </Card>
    </motion.div>
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

interface DashboardHomeProps {
  onNavigate?: (tabId: string) => void;
  onCreateTracking?: () => void;
}

export default function DashboardHome({ onNavigate, onCreateTracking }: DashboardHomeProps) {
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [bounceAlerts, setBounceAlerts] = useState<BounceAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: stats, isLoading: isLoadingStats } = useTrackingStats();
  const { data: emails, isLoading: isLoadingEmails } = useTrackedEmails({ limit: 50 });
  const { data: trends, isLoading: isLoadingTrends } = useTrackingTrends(7);
  const { refresh } = useRefreshStats();
  const { 
    enabledWidgets, 
    isEditing, 
    setIsEditing, 
    setWidgetOrder, 
    updateWidgetSize 
  } = useDashboardWidgets();

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

  // Renderizar widget baseado no tipo
  const renderWidget = useCallback((widget: DashboardWidget) => {
    switch (widget.type) {
      case 'realtime-metrics':
        return (
          <AnimatedWidgetCard
            title="Métricas em Tempo Real"
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            description="Acompanhe aberturas e cliques ao vivo"
          >
            <RealtimeMetrics />
          </AnimatedWidgetCard>
        );
      case 'weekly-trends':
        return (
          <AnimatedWidgetCard
            title="Tendência Semanal"
            icon={<TrendingUp className="h-4 w-4" />}
            description="Aberturas e cliques nos últimos 7 dias"
          >
            <WeeklyTrendChart data={chartData} isLoading={isLoadingTrends} />
          </AnimatedWidgetCard>
        );
      case 'quick-actions':
        return (
          <AnimatedWidgetCard
            title="Ações Rápidas"
            icon={<Zap className="h-4 w-4 text-primary" />}
            description="Acesso rápido às principais funções"
          >
            <QuickActions 
              onNavigate={(tabId) => onNavigate?.(tabId)} 
              onCreateTracking={onCreateTracking}
            />
          </AnimatedWidgetCard>
        );
      case 'performance-gauge':
        return (
          <PerformanceGauge
            openRate={metrics.openRate}
            clickRate={metrics.clickRate}
            bounceRate={metrics.bounceRate}
          />
        );
      case 'bounce-alerts':
        return (
          <AnimatedWidgetCard
            title="Alertas de Bounce"
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            description="Emails que falharam na entrega"
          >
            <BounceAlerts alerts={bounceAlerts} isLoading={isLoadingEmails} />
          </AnimatedWidgetCard>
        );
      case 'recent-events':
        return (
          <AnimatedWidgetCard
            title="Atividade em Tempo Real"
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            description="Últimos eventos de tracking"
          >
            <RealtimeEvents events={realtimeEvents} isLoading={isLoadingEmails} />
          </AnimatedWidgetCard>
        );
      case 'top-recipients':
        return (
          <AnimatedWidgetCard
            title="Destinatários Únicos"
            icon={<Users className="h-4 w-4 text-primary" />}
            description="Contatos mais engajados"
          >
            <div className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {emails 
                    ? new Set(emails.map(e => e.recipient_email)).size.toLocaleString('pt-BR')
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground">contatos únicos</p>
              </div>
            </div>
          </AnimatedWidgetCard>
        );
      case 'delivery-stats':
        return (
          <AnimatedWidgetCard
            title="Estatísticas de Entrega"
            icon={<Mail className="h-4 w-4 text-blue-500" />}
            description="Resumo de deliverability"
          >
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {trendsSummary?.totalOpens?.toLocaleString('pt-BR') || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Aberturas (7d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {trendsSummary?.totalClicks?.toLocaleString('pt-BR') || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Cliques (7d)</p>
              </div>
            </div>
          </AnimatedWidgetCard>
        );
      default:
        return null;
    }
  }, [chartData, isLoadingTrends, metrics, bounceAlerts, isLoadingEmails, realtimeEvents, emails, trendsSummary, onNavigate, onCreateTracking]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground">
            Acompanhe suas métricas e eventos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WidgetCustomizer 
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Editing Mode Banner */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-primary">
                <strong>Modo de edição:</strong> Arraste os widgets para reorganizar. Clique nos botões para redimensionar.
              </p>
              <Button size="sm" onClick={() => setIsEditing(false)}>
                Concluir
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Widgets Customizáveis com Drag-and-Drop */}
      <section data-tour="dashboard-widgets">
        <DraggableWidgetGrid
          widgets={enabledWidgets}
          renderWidget={renderWidget}
          isEditing={isEditing}
          onReorder={setWidgetOrder}
          onSizeChange={updateWidgetSize}
        />
      </section>

    </div>
  );
}
