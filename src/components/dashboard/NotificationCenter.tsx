// =============================================================================
// Notification Center - Central de notificações com push desktop
// =============================================================================

import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  BellOff,
  BellRing,
  Eye,
  MousePointerClick,
  AlertTriangle,
  FileText,
  Check,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'open' | 'click' | 'bounce' | 'document' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
}

interface NotificationSettings {
  desktopEnabled: boolean;
  soundEnabled: boolean;
  showOpens: boolean;
  showClicks: boolean;
  showBounces: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  desktopEnabled: false,
  soundEnabled: true,
  showOpens: true,
  showClicks: true,
  showBounces: true,
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const { permission, isSupported, requestPermission, showNotification } = useDesktopNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleEnableDesktop = async () => {
    if (permission === 'granted') {
      setSettings(prev => ({ ...prev, desktopEnabled: true }));
      toast.success('Notificações desktop ativadas!');
    } else if (permission === 'default') {
      const result = await requestPermission();
      if (result === 'granted') {
        setSettings(prev => ({ ...prev, desktopEnabled: true }));
        toast.success('Notificações desktop ativadas!');
        // Enviar notificação de teste
        showNotification({
          title: '🔔 Notificações Ativadas!',
          body: 'Você receberá alertas quando seus emails forem abertos.',
        });
      } else {
        toast.error('Permissão negada para notificações');
      }
    } else {
      toast.error('Notificações bloqueadas pelo navegador');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'open':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'click':
        return <MousePointerClick className="h-4 w-4 text-green-500" />;
      case 'bounce':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 animate-pulse" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} novas</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSettings ? (
          <div className="p-4 space-y-4">
            <h5 className="font-medium text-sm">Configurações</h5>
            
            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.desktopEnabled ? (
                  <BellRing className="h-4 w-4 text-green-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Notificações Desktop</span>
              </div>
              {isSupported ? (
                <Switch
                  checked={settings.desktopEnabled && permission === 'granted'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnableDesktop();
                    } else {
                      setSettings(prev => ({ ...prev, desktopEnabled: false }));
                    }
                  }}
                />
              ) : (
                <Badge variant="outline" className="text-xs">Não suportado</Badge>
              )}
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Som de Notificação</span>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, soundEnabled: checked }))
                }
              />
            </div>

            <div className="border-t pt-3 space-y-3">
              <h6 className="text-xs font-medium text-muted-foreground uppercase">Tipos de Alerta</h6>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Aberturas</span>
                </div>
                <Switch
                  checked={settings.showOpens}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, showOpens: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Cliques</span>
                </div>
                <Switch
                  checked={settings.showClicks}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, showClicks: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Bounces</span>
                </div>
                <Switch
                  checked={settings.showBounces}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, showBounces: checked }))
                  }
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSettings(false)}
            >
              Voltar
            </Button>
          </div>
        ) : (
          <>
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                  <Check className="h-3 w-3 mr-1" />
                  Marcar como lidas
                </Button>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 text-destructive">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma notificação</p>
                  <p className="text-xs">Você verá alertas de emails aqui</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                        !notification.read && 'bg-primary/5'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm truncate', !notification.read && 'font-medium')}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
