import { useState, useMemo, type ReactNode } from 'react';
import { useNotificationHistory, NotificationHistoryItem } from '@/hooks/use-notification-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Bell, 
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
  Clock,
  Filter,
  CalendarIcon,
  X
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { matchFirst } from "@/lib/variant";
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

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Type filter
      if (typeFilter !== 'all' && notification.type !== typeFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && notification.severity !== severityFilter) {
        return false;
      }

      // Date range filter
      if (dateRange?.from) {
        const notificationDate = new Date(notification.created_at);
        if (isBefore(notificationDate, startOfDay(dateRange.from))) {
          return false;
        }
        if (dateRange.to && isAfter(notificationDate, endOfDay(dateRange.to))) {
          return false;
        }
      }

      return true;
    });
  }, [notifications, typeFilter, severityFilter, dateRange]);

  const hasActiveFilters = typeFilter !== 'all' || severityFilter !== 'all' || dateRange?.from;

  const clearFilters = () => {
    setTypeFilter('all');
    setSeverityFilter('all');
    setDateRange(undefined);
  };

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
          <div className="flex items-center justify-between flex-wrap gap-4">
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="bounce_alert">Alerta de Bounce</SelectItem>
                <SelectItem value="email_open">Email Aberto</SelectItem>
                <SelectItem value="link_click">Link Clicado</SelectItem>
                <SelectItem value="document_view">Documento Visualizado</SelectItem>
                <SelectItem value="reminder">Lembrete</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas severidades</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {matchFirst<ReactNode>([
                    [dateRange?.from && dateRange.to, () => (
                      <>
                        {format(dateRange?.from ?? new Date(), "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange?.to ?? new Date(), "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    )],
                    [dateRange?.from, () => format(dateRange?.from ?? new Date(), "dd/MM/yyyy", { locale: ptBR })],
                  ], () => (
                    <span>Período</span>
                  ))}

                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}

            {/* Results count */}
            {hasActiveFilters && (
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredNotifications.length} de {notifications.length} notificações
              </span>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {matchFirst([
  [notifications.length === 0, () => ((
            <EmptyState
              type="notifications"
              title="Nenhuma notificação"
              description="Suas notificações aparecerão aqui quando você receber alertas."
            />
          ))],
  [filteredNotifications.length === 0, () => ((
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma notificação encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma notificação corresponde aos filtros selecionados
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          ))],
], () => ((
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )))}
        </CardContent>
      </Card>
    </div>
  );
}
