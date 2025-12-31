import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Loader2,
  User,
  Globe,
  Key,
  Lock
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: string;
  description: string;
  ip_address: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface SecurityEventsPanelProps {
  limit?: number;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  login: <User className="w-4 h-4" />,
  logout: <User className="w-4 h-4" />,
  reauthentication: <Key className="w-4 h-4" />,
  password_change: <Lock className="w-4 h-4" />,
  mfa_enabled: <Shield className="w-4 h-4" />,
  mfa_disabled: <Shield className="w-4 h-4" />,
  failed_login: <AlertTriangle className="w-4 h-4" />,
  ip_blocked: <Globe className="w-4 h-4" />,
  rate_limit: <Activity className="w-4 h-4" />,
};

const SEVERITY_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
  info: { 
    badge: 'bg-blue-500/10 text-blue-500', 
    icon: <Info className="w-4 h-4 text-blue-500" /> 
  },
  warning: { 
    badge: 'bg-yellow-500/10 text-yellow-500', 
    icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> 
  },
  error: { 
    badge: 'bg-destructive/10 text-destructive', 
    icon: <AlertTriangle className="w-4 h-4 text-destructive" /> 
  },
  critical: { 
    badge: 'bg-destructive/10 text-destructive', 
    icon: <AlertTriangle className="w-4 h-4 text-destructive" /> 
  },
  success: { 
    badge: 'bg-green-500/10 text-green-500', 
    icon: <CheckCircle className="w-4 h-4 text-green-500" /> 
  },
};

export default function SecurityEventsPanel({ limit = 50 }: SecurityEventsPanelProps) {
  const { user } = useAuth();

  // Fetch security events
  const { data: events, isLoading } = useQuery({
    queryKey: ['securityEvents', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SecurityEvent[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Subscribe to realtime updates
  // useEffect handled separately

  const getEventIcon = (eventType: string) => {
    return EVENT_ICONS[eventType] || <Activity className="w-4 h-4" />;
  };

  const getSeverityStyle = (severity: string) => {
    return SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Eventos de Segurança</CardTitle>
            <CardDescription>
              Atividades recentes relacionadas à segurança
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : events?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento de segurança registrado
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {events?.map((event) => {
              const style = getSeverityStyle(event.severity);
              
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                >
                  <div className={`p-2 rounded-full ${style.badge}`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">
                        {formatEventType(event.event_type)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${style.badge}`}
                      >
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                      {event.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {event.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
