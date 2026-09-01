import { Card, CardContent } from '@/components/ui/card';
import { Shield, Monitor, Key, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function SecurityOverviewCards() {
  const { user } = useAuth();

  const { data: sessionsCount, isLoading: loadingSessions } = useQuery({
    queryKey: ['activeSessions', 'count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: mfaSettings, isLoading: loadingMFA } = useQuery({
    queryKey: ['mfaSettings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: alertsCount, isLoading: loadingAlerts } = useQuery({
    queryKey: ['securityAlerts', 'count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('severity', 'warning')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const { data: loginAttempts, isLoading: loadingAttempts } = useQuery({
    queryKey: ['loginAttempts', 'recent', user?.id],
    queryFn: async () => {
      if (!user?.email) return { success: 0, failed: 0 };
      const { data, error } = await supabase
        .from('login_attempts')
        .select('success')
        .eq('email', user.email)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      const success = data?.filter(a => a.success).length || 0;
      const failed = data?.filter(a => !a.success).length || 0;
      return { success, failed };
    },
    enabled: !!user?.email,
  });

  const mfaLastUseLabel = `Último uso: ${mfaSettings?.last_verified_at ? 'Recente' : 'N/A'}`;

  const cards = [
    {
      title: 'Status de Segurança',
      value: mfaSettings?.is_enabled ? 'Protegido' : 'Básico',
      description: mfaSettings?.is_enabled ? 'MFA ativo' : 'Ative o MFA para maior proteção',
      icon: Shield,
      color: mfaSettings?.is_enabled ? 'text-green-500' : 'text-yellow-500',
      bgColor: mfaSettings?.is_enabled ? 'bg-green-500/10' : 'bg-yellow-500/10',
      loading: loadingMFA,
    },
    {
      title: 'Sessões Ativas',
      value: sessionsCount?.toString() || '0',
      description: 'Dispositivos conectados',
      icon: Monitor,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      loading: loadingSessions,
    },
    {
      title: 'Autenticação MFA',
      value: mfaSettings?.is_enabled ? 'Ativo' : 'Inativo',
      description: mfaSettings?.is_enabled
        ? mfaLastUseLabel
        : 'Configure para maior segurança',

      icon: Key,
      color: mfaSettings?.is_enabled ? 'text-green-500' : 'text-muted-foreground',
      bgColor: mfaSettings?.is_enabled ? 'bg-green-500/10' : 'bg-muted/50',
      loading: loadingMFA,
    },
    {
      title: 'Alertas (7 dias)',
      value: alertsCount?.toString() || '0',
      description: loginAttempts?.failed ? `${loginAttempts.failed} tentativas falhas (24h)` : 'Nenhuma tentativa falha',
      icon: AlertTriangle,
      color: alertsCount && alertsCount > 0 ? 'text-orange-500' : 'text-green-500',
      bgColor: alertsCount && alertsCount > 0 ? 'bg-orange-500/10' : 'bg-green-500/10',
      loading: loadingAlerts || loadingAttempts,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            {card.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-32" />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{card.value}</p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground line-clamp-2">
                    {card.description}
                  </p>
                </div>
                <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${card.bgColor}`}>
                  <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${card.color}`} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
