// =============================================================================
// FUXICO - Dashboard Home Consolidado
// =============================================================================

import { useEffect, useState, useMemo } from 'react';
import { log } from '@/lib/logger';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StreakIndicator, LevelProgress } from '@/components/ui/gamification';
import { Confetti } from '@/components/ui/confetti';
import {
  Mail, MousePointerClick, Eye, AlertTriangle, TrendingUp,
  RefreshCw, Zap, Flame,
} from 'lucide-react';
import { QuickActions } from './QuickActions';
import { useDashboardWidgets } from '@/hooks/use-dashboard-widgets';
import { useTrackingStats, useTrackedEmails, useRefreshStats } from '@/hooks/use-tracking';
import { useTrackingTrends } from '@/hooks/use-tracking-trends';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { RealtimeEvent, BounceAlert } from './home/types';
import { MetricCard } from './home/MetricCard';
import { RealtimeEvents } from './home/RealtimeEvents';
import { BounceAlerts } from './home/BounceAlerts';
import { WeeklyTrendChart } from './home/WeeklyTrendChart';

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
  const { isLoading: isLoadingEmails } = useTrackedEmails({ limit: 50 });
  const { data: trends, isLoading: isLoadingTrends } = useTrackingTrends(7);
  const { refresh } = useRefreshStats();
  useDashboardWidgets();

  const metrics = useMemo(() => {
    if (!stats) {
      return { totalEmails: 0, totalOpens: 0, totalClicks: 0, bounceRate: 0, openRate: 0, clickRate: 0 };
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

  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    return trends.map((day) => ({
      date: format(new Date(day.date), 'dd/MM', { locale: ptBR }),
      opens: day.opens,
      clicks: day.clicks,
      emails: 0,
    }));
  }, [trends]);

  const trendsSummary = useMemo(() => {
    if (!trends || trends.length === 0) return null;
    return {
      totalOpens: trends.reduce((sum, d) => sum + d.opens, 0),
      totalClicks: trends.reduce((sum, d) => sum + d.clicks, 0),
    };
  }, [trends]);

  // Load recent data
  useEffect(() => {
    async function loadRecentData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: events } = await supabase
          .from('tracking_events')
          .select(`id, event_type, created_at, tracking_id, tracked_emails!inner(recipient_email, subject, user_id)`)
          .eq('tracked_emails.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (events) {
          const formattedEvents: RealtimeEvent[] = (events as Array<{
            id: string; event_type: string; created_at: string; tracking_id: string;
            tracked_emails: { recipient_email: string; subject: string | null; user_id: string | null };
          }>).map((e) => ({
            id: e.id,
            type: e.event_type as RealtimeEvent['type'],
            email: e.tracked_emails?.recipient_email || 'N/A',
            subject: e.tracked_emails?.subject ?? undefined,
            timestamp: e.created_at,
          }));
          setRealtimeEvents(formattedEvents);
        }

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

  // Realtime listener
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tracking_events' },
        async (payload) => {
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

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refresh(); } finally { setIsRefreshing(false); }
  };

  // Gamification
  const [lastVisit, setLastVisit] = useLocalStorage<string>('fuxico-last-visit', '');
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    if (lastVisit) {
      const daysDiff = differenceInDays(new Date(), new Date(lastVisit));
      if (daysDiff === 1) {
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak % 7 === 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
          return newStreak;
        });
      } else if (daysDiff > 1) {
        setStreak(1);
      }
    } else {
      setStreak(1);
    }
    setLastVisit(today);
  }, []);

  const userXP = useMemo(() => {
    return metrics.totalEmails * 10 + metrics.totalOpens * 5 + metrics.totalClicks * 15;
  }, [metrics]);

  const currentLevel = Math.floor(userXP / 1000) + 1;
  const xpForNextLevel = 1000;
  const currentLevelXP = userXP - ((currentLevel - 1) * 1000);

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti trigger={showConfetti} />}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Visão Geral
              {streak >= 3 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-orange-500">
                  <Flame className="h-5 w-5" />
                </motion.span>
              )}
            </h2>
            <p className="text-muted-foreground">Acompanhe suas métricas e eventos em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StreakIndicator count={streak} />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Level */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <LevelProgress level={currentLevel} currentXP={currentLevelXP} requiredXP={xpForNextLevel} title="Seu Nível" />
      </motion.div>

      {/* Metrics */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6" data-tour="stats-cards">
        <MetricCard title="Total de Emails" value={metrics.totalEmails.toLocaleString('pt-BR')} icon={<Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />} isLoading={isLoadingStats} />
        <MetricCard title="Aberturas" value={metrics.totalOpens.toLocaleString('pt-BR')} change={metrics.openRate} changeLabel="taxa" icon={<Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />} trend={metrics.openRate > 20 ? 'up' : metrics.openRate < 10 ? 'down' : 'neutral'} isLoading={isLoadingStats} />
        <MetricCard title="Cliques" value={metrics.totalClicks.toLocaleString('pt-BR')} change={metrics.clickRate} changeLabel="taxa" icon={<MousePointerClick className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />} trend={metrics.clickRate > 5 ? 'up' : metrics.clickRate < 2 ? 'down' : 'neutral'} isLoading={isLoadingStats} />
        <MetricCard title="Taxa de Bounce" value={`${metrics.bounceRate.toFixed(1)}%`} icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />} trend={metrics.bounceRate < 2 ? 'up' : metrics.bounceRate > 5 ? 'down' : 'neutral'} isLoading={isLoadingStats} />
      </section>

      {/* Widgets Grid */}
      <section className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" data-tour="dashboard-widgets">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Tendência Semanal</CardTitle>
            <CardDescription>Aberturas e cliques nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent><WeeklyTrendChart data={chartData} isLoading={isLoadingTrends} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às principais funções</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions onNavigate={(tabId) => onNavigate?.(tabId)} onCreateTracking={onCreateTracking} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" />Atividade em Tempo Real</CardTitle>
            <CardDescription>Últimos eventos de tracking</CardDescription>
          </CardHeader>
          <CardContent><RealtimeEvents events={realtimeEvents} isLoading={isLoadingEmails} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Alertas de Bounce</CardTitle>
            <CardDescription>Emails que falharam na entrega</CardDescription>
          </CardHeader>
          <CardContent><BounceAlerts alerts={bounceAlerts} isLoading={isLoadingEmails} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-500" />Estatísticas de Entrega</CardTitle>
            <CardDescription>Resumo de deliverability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{trendsSummary?.totalOpens?.toLocaleString('pt-BR') || '-'}</p>
                <p className="text-xs text-muted-foreground">Aberturas (7d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{trendsSummary?.totalClicks?.toLocaleString('pt-BR') || '-'}</p>
                <p className="text-xs text-muted-foreground">Cliques (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
