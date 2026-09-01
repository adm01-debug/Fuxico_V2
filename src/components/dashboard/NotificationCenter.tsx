// =============================================================================
// FUXICO - Premium Notification Center
// =============================================================================

import { memo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { permission, isSupported, requestPermission, showNotification } = useDesktopNotifications();
  
  // Use global realtime notifications hook to ensure consistency
  useRealtimeNotifications();

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
    toast.success('Todas as notificações marcadas como lidas');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('Notificações limpas');
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-primary/10 transition-colors"
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
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-destructive border-2 border-background"
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
        className="w-[380px] p-0 overflow-hidden border-border/50 shadow-2xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Notificações</h4>
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
            <Settings className={cn("h-4 w-4 transition-transform", showSettings && "rotate-90")} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </h5>
              
              {/* Desktop Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    settings.desktopEnabled && permission === 'granted' ? "bg-success/10" : "bg-muted"
                  )}>
                    {settings.desktopEnabled && permission === 'granted' ? (
                      <BellRing className="h-4 w-4 text-success" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Notificações Desktop</span>
                    <p className="text-xs text-muted-foreground">Receba alertas mesmo fora do app</p>
                  </div>
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
                  <Badge variant="outline" className="text-xs">Indisponível</Badge>
                )}
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    settings.soundEnabled ? "bg-primary/10" : "bg-muted"
                  )}>
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
                    setSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h6 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                      <Switch
                        checked={settings[key]}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, [key]: checked }))
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
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
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
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead} 
                    className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAll} 
                    className="text-xs h-7 gap-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>
              )}

              <ScrollArea className="h-[340px]">
                {notifications.length === 0 ? (
                  <div role="region" aria-label="Central de Notificações" className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                      <div className="relative bg-muted/50 rounded-full p-5">
                        <Bell className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    </div>
                    <p className="mt-4 font-medium text-sm">Tudo em dia!</p>
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
                              'group flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-all relative',
                              !notification.read && 'bg-primary/5'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            {/* Unread indicator */}
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            )}
                            
                            <div className={cn(
                              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                              config.bgColor,
                              "border",
                              config.borderColor
                            )}>
                              <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  'text-sm truncate',
                                  !notification.read && 'font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                  onClick={(e) => removeNotification(notification.id, e)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.color, config.bgColor)}>
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
