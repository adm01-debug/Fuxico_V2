import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession, ActiveSession } from '@/hooks/useSession';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Monitor, 
  Smartphone,
  Globe,
  Clock,
  Trash2,
  LogOut,
  Loader2,
  CheckCircle
} from 'lucide-react';

const getDeviceIcon = (userAgent: string | null) => {
  if (!userAgent) return <Monitor className="w-5 h-5" />;
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="w-5 h-5" />;
  }
  return <Monitor className="w-5 h-5" />;
};

const getDeviceName = (userAgent: string | null) => {
  if (!userAgent) return 'Dispositivo desconhecido';
  
  const ua = userAgent.toLowerCase();
  
  // OS Detection
  let os = 'Sistema desconhecido';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Browser Detection
  let browser = '';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  return browser ? `${browser} em ${os}` : os;
};

export default function ActiveSessionsPanel() {
  const { session } = useAuth();
  const { activeSessions, isLoading, terminateSession, terminateAllOther, isTerminating } = useSession();
  const currentSessionToken = session?.access_token?.substring(0, 50);

  const isCurrentSession = (sess: ActiveSession) => {
    // Match by session token
    return sess.session_token === currentSessionToken;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>
                Dispositivos onde você está conectado
              </CardDescription>
            </div>
          </div>
          {activeSessions.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (confirm('Deseja encerrar todas as outras sessões?')) {
                  terminateAllOther();
                }
              }}
              disabled={isTerminating}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Encerrar outras
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma sessão ativa encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((sess) => {
              const isCurrent = isCurrentSession(sess);
              
              return (
                <div
                  key={sess.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isCurrent ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getDeviceIcon(sess.user_agent)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getDeviceName(sess.user_agent)}</p>
                        {isCurrent && (
                          <Badge className="bg-primary/10 text-primary border-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Atual
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {sess.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {sess.ip_address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última atividade: {new Date(sess.last_activity_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Deseja encerrar esta sessão?')) {
                          terminateSession(sess.id);
                        }
                      }}
                      disabled={isTerminating}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
