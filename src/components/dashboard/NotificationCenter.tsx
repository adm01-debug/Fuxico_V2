// =============================================================================
// FUXICO - Premium Notification Center
// =============================================================================

import { memo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  BellRing,
  Eye,
  MousePointerClick,
  AlertTriangle,
  FileText,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  CheckCheck,
  X,
} from 'lucide-react';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';

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

const notificationTypeConfig = {
  open: {
    icon: Eye,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Abertura',
  },
  click: {
    icon: MousePointerClick,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    label: 'Clique',
  },
  bounce: {
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    label: 'Bounce',
  },
  document: {
    icon: FileText,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    label: 'Documento',
  },
  system: {
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    label: 'Sistema',
  },
};

function NotificationCenterBase() {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>(
    'notification-settings',
    DEFAULT_SETTINGS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { permission, isSupported, requestPermission, showNotification } =
    useDesktopNotifications();

  // Use global realtime notifications hook to ensure consistency
  useRealtimeNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleEnableDesktop = async () => {
    if (permission === 'granted') {
      setSettings((prev) => ({ ...prev, desktopEnabled: true }));
      toast.success('Notificações desktop ativadas!');
    } else if (permission === 'default') {
      const result = await requestPermission();
      if (result === 'granted') {
        setSettings((prev) => ({ ...prev, desktopEnabled: true }));
        toast.success('Notificações desktop ativadas!');
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Todas as notificações marcadas como lidas');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('Notificações limpas');
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-colors hover:bg-primary/10"
        >
          <AnimatePresence mode="wait">
            {unreadCount > 0 ? (
              <motion.div
                key="ringing"
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 15, -15, 10, -10, 5, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <BellRing className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <Bell className="h-5 w-5" />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Badge
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center border-2 border-background bg-destructive p-0 text-[10px] font-bold"
                  variant="destructive"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] overflow-hidden border-border/50 p-0 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Notificações</h4>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} não lidas</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className={cn('h-4 w-4 transition-transform', showSettings && 'rotate-90')} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-4"
            >
              <h5 className="flex items-center gap-2 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Configurações
              </h5>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      settings.desktopEnabled && permission === 'granted'
                        ? 'bg-success/10'
                        : 'bg-muted'
                    )}
                  >
                    {settings.desktopEnabled && permission === 'granted' ? (
                      <BellRing className="h-4 w-4 text-success" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Notificações Desktop</span>
                    <p className="text-xs text-muted-foreground">
                      Receba alertas mesmo fora do app
                    </p>
                  </div>
                </div>
                {isSupported ? (
                  <Switch
                    checked={settings.desktopEnabled && permission === 'granted'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleEnableDesktop();
                      } else {
                        setSettings((prev) => ({ ...prev, desktopEnabled: false }));
                      }
                    }}
                  />
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Indisponível
                  </Badge>
                )}
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      settings.soundEnabled ? 'bg-primary/10' : 'bg-muted'
                    )}
                  >
                    {settings.soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Som</span>
                    <p className="text-xs text-muted-foreground">Alerta sonoro ao receber</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h6 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipos de Alerta
                </h6>

                {(['showOpens', 'showClicks', 'showBounces'] as const).map((key) => {
                  const config = {
                    showOpens: { ...notificationTypeConfig.open, label: 'Aberturas' },
                    showClicks: { ...notificationTypeConfig.click, label: 'Cliques' },
                    showBounces: { ...notificationTypeConfig.bounce, label: 'Bounces' },
                  }[key];

                  const Icon = config.icon;

                  return (
                    <div key={key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', config.color)} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                      <Switch
                        checked={settings[key]}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowSettings(false)}
              >
                <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                Voltar
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Quick actions */}
              {notifications.length > 0 && (
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-7 gap-1.5 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[340px]">
                {notifications.length === 0 ? (
                  <div
                    role="region"
                    aria-label="Central de Notificações"
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
                      <div className="relative rounded-full bg-muted/50 p-5">
                        <Bell className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium">Tudo em dia!</p>
                    <p className="text-xs text-muted-foreground/70">Notificações aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <AnimatePresence>
                      {notifications.map((notification, index) => {
                        const config = notificationTypeConfig[notification.type];
                        const Icon = config.icon;

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              'group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-all hover:bg-muted/50',
                              !notification.read && 'bg-primary/5'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            {/* Unread indicator */}
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                              />
                            )}

                            <div
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                                config.bgColor,
                                'border',
                                config.borderColor
                              )}
                            >
                              <Icon className={cn('h-4 w-4', config.color)} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    'truncate text-sm',
                                    !notification.read && 'font-semibold'
                                  )}
                                >
                                  {notification.title}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="-mr-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                                  onClick={(e) => removeNotification(notification.id, e)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'px-1.5 py-0 text-[10px]',
                                    config.color,
                                    config.bgColor
                                  )}
                                >
                                  {config.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(notification.timestamp), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

export const NotificationCenter = memo(NotificationCenterBase);
