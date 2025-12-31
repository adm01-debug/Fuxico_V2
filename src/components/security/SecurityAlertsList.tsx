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
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = getSeverityConfig(alert.severity);
        const Icon = config.icon;
        const metadata = alert.metadata as any;

        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 rounded-lg border"
          >
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">
                  {getEventTypeLabel(alert.event_type)}
                </p>
                <Badge variant={config.badge} className="text-xs">
                  {alert.severity === 'error' ? 'Crítico' : 'Atenção'}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {alert.description}
              </p>

              {!compact && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  {alert.ip_address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.ip_address}
                    </span>
                  )}
                  {metadata?.device && (
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {metadata.device}
                    </span>
                  )}
                </div>
              )}

              {compact && (
                <p className="text-xs text-muted-foreground mt-1">
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
        <Button variant="link" className="w-full" size="sm">
          Ver todos os alertas →
        </Button>
      )}
    </div>
  );
}
