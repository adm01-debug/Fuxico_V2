import { Badge } from '@/components/ui/badge';
import { Shield, Key, Monitor, LogIn, LogOut, Settings, AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityEventsListProps {
  limit?: number;
}

export function SecurityEventsList({ limit = 10 }: SecurityEventsListProps) {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ['securityEvents', 'all', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getEventConfig = (eventType: string, severity: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      'login': { icon: LogIn, color: 'text-green-500', label: 'Login realizado' },
      'logout': { icon: LogOut, color: 'text-blue-500', label: 'Logout realizado' },
      'failed_login': { icon: AlertTriangle, color: 'text-orange-500', label: 'Login falhou' },
      'mfa_enabled': { icon: Shield, color: 'text-green-500', label: 'MFA ativado' },
      'mfa_disabled': { icon: Shield, color: 'text-orange-500', label: 'MFA desativado' },
      'mfa_verified': { icon: Key, color: 'text-green-500', label: 'MFA verificado' },
      'password_change': { icon: Key, color: 'text-blue-500', label: 'Senha alterada' },
      'email_change': { icon: Settings, color: 'text-blue-500', label: 'Email alterado' },
      'new_device': { icon: Monitor, color: 'text-yellow-500', label: 'Novo dispositivo' },
      'session_terminated': { icon: LogOut, color: 'text-orange-500', label: 'Sessão encerrada' },
      'reauthentication': { icon: Key, color: 'text-blue-500', label: 'Reautenticação' },
      'backup_codes_regenerated': { icon: Key, color: 'text-blue-500', label: 'Códigos regenerados' },
    };

    return configs[eventType] || { 
      icon: Shield, 
      color: severity === 'error' ? 'text-destructive' : 'text-muted-foreground', 
      label: eventType 
    };
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs">Atenção</Badge>;
      case 'info':
        return <Badge variant="outline" className="text-xs">Info</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum evento de segurança registrado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const config = getEventConfig(event.event_type, event.severity);
          const Icon = config.icon;
          const metadata = event.metadata as any;

          return (
            <div key={event.id} className="relative flex items-start gap-4 pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-0 p-2 rounded-full bg-background border-2 ${
                event.severity === 'error' ? 'border-destructive' :
                event.severity === 'warning' ? 'border-orange-500' :
                'border-border'
              }`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>

              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{config.label}</p>
                  {getSeverityBadge(event.severity)}
                </div>

                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {event.ip_address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.ip_address}
                    </span>
                  )}
                  {metadata?.browser && (
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {metadata.browser}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
