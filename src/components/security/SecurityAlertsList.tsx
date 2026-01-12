import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Info, XCircle, Clock, MapPin, Monitor } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityAlertsListProps {
  limit?: number;
  compact?: boolean;
}

export function SecurityAlertsList({ limit, compact = false }: SecurityAlertsListProps) {
  const { user } = useAuth();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['securityEvents', 'warnings', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .in('severity', ['warning', 'error'])
        .order('created_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'error':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          badge: 'destructive' as const,
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          badge: 'secondary' as const,
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          badge: 'outline' as const,
        };
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'failed_login': 'Tentativa de login falha',
      'new_device': 'Novo dispositivo detectado',
      'password_change': 'Senha alterada',
      'mfa_disabled': 'MFA desativado',
      'suspicious_activity': 'Atividade suspeita',
      'rate_limit_exceeded': 'Limite de requisições excedido',
      'session_terminated': 'Sessão encerrada',
      'account_locked': 'Conta bloqueada',
    };
    return labels[eventType] || eventType;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p>Nenhum alerta de segurança</p>
        <p className="text-sm">Sua conta está segura</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {alerts.map((alert) => {
        const config = getSeverityConfig(alert.severity);
        const Icon = config.icon;
        const metadata = alert.metadata as Record<string, string | undefined> | null;

        return (
          <div
            key={alert.id}
            className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border"
          >
            <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${config.bgColor}`}>
              <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 flex-wrap">
                <p className="font-medium text-xs sm:text-sm leading-tight">
                  {getEventTypeLabel(alert.event_type)}
                </p>
                <Badge variant={config.badge} className="text-[10px] sm:text-xs px-1.5 py-0.5">
                  {alert.severity === 'error' ? 'Crítico' : 'Atenção'}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {alert.description}
              </p>

              {!compact && (
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatDistanceToNow(new Date(alert.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  {alert.ip_address && (
                    <span className="flex items-center gap-1 hidden xs:flex">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{alert.ip_address}</span>
                    </span>
                  )}
                  {metadata?.device && (
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <Monitor className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[120px]">{metadata.device}</span>
                    </span>
                  )}
                </div>
              )}

              {compact && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {compact && alerts.length > 0 && (
        <Button variant="link" className="w-full h-10" size="sm">
          Ver todos os alertas →
        </Button>
      )}
    </div>
  );
}
