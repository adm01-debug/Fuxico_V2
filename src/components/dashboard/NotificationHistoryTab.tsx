import { useNotificationHistory, NotificationHistoryItem } from '@/hooks/use-notification-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Mail,
  Link as LinkIcon,
  FileText,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const severityConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', badge: 'default' as const },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', badge: 'secondary' as const },
  critical: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', badge: 'destructive' as const },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', badge: 'default' as const },
};

const typeConfig: Record<string, { icon: typeof Bell; label: string }> = {
  bounce_alert: { icon: AlertTriangle, label: 'Alerta de Bounce' },
  email_open: { icon: Mail, label: 'Email Aberto' },
  link_click: { icon: LinkIcon, label: 'Link Clicado' },
  document_view: { icon: FileText, label: 'Documento Visualizado' },
  reminder: { icon: Clock, label: 'Lembrete' },
};

function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: NotificationHistoryItem; 
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const severity = severityConfig[notification.severity] || severityConfig.info;
  const type = typeConfig[notification.type] || { icon: Bell, label: notification.type };
  const SeverityIcon = severity.icon;
  const TypeIcon = type.icon;

  return (
    <div 
      className={`p-4 rounded-lg border transition-colors ${
        notification.is_read ? 'bg-muted/30' : 'bg-card border-primary/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${severity.bg}`}>
          <SeverityIcon className={`h-4 w-4 ${severity.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium truncate ${notification.is_read ? 'text-muted-foreground' : ''}`}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <Badge variant="default" className="h-5 text-xs">Novo</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TypeIcon className="h-3 w-3" />
              <span>{type.label}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAsRead}
                  title="Marcar como lida"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationHistoryTab() {
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotificationHistory();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Histórico de Notificações
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Visualize e gerencie suas notificações anteriores
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
              
              {notifications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar histórico</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir todas as notificações? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => clearAll()}>
                        Excluir todas
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground">
                Suas notificações aparecerão aqui quando você receber alertas
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {notifications.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
