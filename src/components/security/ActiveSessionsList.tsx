import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, Globe, MapPin, Clock, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ActiveSessionsListProps {
  limit?: number;
  compact?: boolean;
}

export function ActiveSessionsList({ limit, compact = false }: ActiveSessionsListProps) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['activeSessions', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const terminateSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Sessão encerrada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao encerrar sessão');
    },
  });

  const terminateAllOtherSessions = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', user?.id)
        .neq('session_token', session?.access_token || '');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Todas as outras sessões foram encerradas');
    },
    onError: () => {
      toast.error('Erro ao encerrar sessões');
    },
  });

  const getDeviceIcon = (deviceInfo: any) => {
    const type = deviceInfo?.device_type?.toLowerCase() || '';
    if (type.includes('mobile') || type.includes('phone')) return Smartphone;
    if (type.includes('tablet')) return Tablet;
    return Monitor;
  };

  const getDeviceName = (deviceInfo: any, userAgent: string | null) => {
    if (deviceInfo?.device_name) return deviceInfo.device_name;
    if (!userAgent) return 'Dispositivo desconhecido';
    
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Navegador Web';
  };

  const getBrowserName = (userAgent: string | null) => {
    if (!userAgent) return 'Navegador desconhecido';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Navegador';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma sessão ativa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {!compact && sessions.length > 1 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 text-xs sm:text-sm">
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Encerrar outras sessões</span>
                <span className="sm:hidden">Encerrar outras</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Encerrar outras sessões?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Isso irá desconectar todos os outros dispositivos da sua conta. Apenas esta sessão atual permanecerá ativa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="h-11 w-full sm:w-auto">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => terminateAllOtherSessions.mutate()} className="h-11 w-full sm:w-auto">
                  Encerrar todas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {sessions.map((s) => {
          const deviceInfo = s.device_info as any;
          const DeviceIcon = getDeviceIcon(deviceInfo);
          const isCurrentSession = s.session_token === session?.access_token;

          return (
            <div
              key={s.id}
              className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border ${
                isCurrentSession ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className={`p-2 rounded-full shrink-0 ${isCurrentSession ? 'bg-primary/10' : 'bg-muted'}`}>
                <DeviceIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${isCurrentSession ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p className="font-medium truncate text-sm sm:text-base">
                    {getDeviceName(deviceInfo, s.user_agent)}
                  </p>
                  {isCurrentSession && (
                    <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Atual
                    </Badge>
                  )}
                </div>
                
                {!compact && (
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[80px] sm:max-w-none">{getBrowserName(s.user_agent)}</span>
                    </span>
                    {s.ip_address && (
                      <span className="flex items-center gap-1 hidden xs:flex">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[100px]">{s.ip_address}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {formatDistanceToNow(new Date(s.last_activity_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                )}

                {compact && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(s.last_activity_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                )}
              </div>

              {!isCurrentSession && !compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => terminateSession.mutate(s.id)}
                  disabled={terminateSession.isPending}
                  className="h-10 w-10 shrink-0"
                  aria-label="Encerrar sessão"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {compact && sessions.length > 0 && (
        <Button variant="link" className="w-full h-10" size="sm">
          Ver todas as sessões →
        </Button>
      )}
    </div>
  );
}
