// =============================================================================
// FUXICO - Enhanced Notification System
// Premium toast notifications with animations and grouping
// =============================================================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  Bell, 
  Mail, 
  Eye, 
  MousePointerClick,
  ExternalLink,
  Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Types
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'email_open' | 'link_click';

interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  action?: NotificationAction;
  undoAction?: () => void;
  dismissible?: boolean;
  icon?: React.ReactNode;
  groupId?: string;
}

interface NotificationGroup {
  id: string;
  type: NotificationType;
  title: string;
  count: number;
  notifications: Notification[];
}

interface NotificationContextValue {
  notifications: Notification[];
  groups: NotificationGroup[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  undoLastAction: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextValue | null>(null);

// Config
const notificationConfig: Record<NotificationType, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string;
  borderColor: string;
}> = {
  success: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  email_open: {
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  link_click: {
    icon: MousePointerClick,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
};

// Single notification component
function NotificationItem({ 
  notification, 
  onRemove,
  isGrouped = false,
}: { 
  notification: Notification; 
  onRemove: () => void;
  isGrouped?: boolean;
}) {
  const config = notificationConfig[notification.type];
  const ConfigIcon = config.icon;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onRemove, 200);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onRemove, 200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        x: isExiting ? 50 : 0, 
        scale: isExiting ? 0.9 : 1 
      }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'bg-popover/95',
        config.borderColor,
        isGrouped && 'p-3'
      )}
    >
      {/* Progress bar */}
      {notification.duration && (
        <motion.div
          className={cn('absolute bottom-0 left-0 h-0.5 rounded-full', config.bgColor)}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
        />
      )}

      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
        config.bgColor
      )}>
        {notification.icon || <ConfigIcon className={cn('h-4 w-4', config.color)} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold">{notification.title}</p>
        {notification.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.description}
          </p>
        )}
        
        {/* Actions */}
        {(notification.action || notification.undoAction) && (
          <div className="flex items-center gap-2 mt-2">
            {notification.action && (
              <Button
                size="sm"
                variant={notification.action.variant || 'default'}
                className="h-7 text-xs"
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            )}
            {notification.undoAction && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={notification.undoAction}
              >
                <Undo2 className="h-3 w-3" />
                Desfazer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {notification.dismissible !== false && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-50 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}

// Grouped notifications
function NotificationGroupItem({
  group,
  onRemoveNotification,
  onClearGroup,
}: {
  group: NotificationGroup;
  onRemoveNotification: (id: string) => void;
  onClearGroup: (groupId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = notificationConfig[group.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        'rounded-xl border shadow-lg backdrop-blur-sm overflow-hidden',
        'bg-popover/95',
        config.borderColor
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
          config.bgColor
        )}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{group.title}</p>
          <p className="text-xs text-muted-foreground">
            {group.count} notificações
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onClearGroup(group.id);
          }}
        >
          Limpar
        </Button>
      </div>

      {/* Expanded notifications */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {group.notifications.slice(0, 5).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRemove={() => onRemoveNotification(notification.id)}
                  isGrouped
                />
              ))}
              {group.notifications.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{group.notifications.length - 5} mais
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastRemovedAction, setLastRemovedAction] = useState<(() => void) | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true,
    };
    
    setNotifications((prev) => [...prev, newNotification].slice(-10)); // Keep max 10
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification?.undoAction) {
        setLastRemovedAction(() => notification.undoAction);
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const undoLastAction = useCallback(() => {
    if (lastRemovedAction) {
      lastRemovedAction();
      setLastRemovedAction(null);
    }
  }, [lastRemovedAction]);

  // Group notifications by groupId
  const groups: NotificationGroup[] = [];
  const ungroupedNotifications: Notification[] = [];

  notifications.forEach((notification) => {
    if (notification.groupId) {
      const existingGroup = groups.find((g) => g.id === notification.groupId);
      if (existingGroup) {
        existingGroup.notifications.push(notification);
        existingGroup.count++;
      } else {
        groups.push({
          id: notification.groupId,
          type: notification.type,
          title: notification.title,
          count: 1,
          notifications: [notification],
        });
      }
    } else {
      ungroupedNotifications.push(notification);
    }
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications: ungroupedNotifications,
        groups,
        addNotification,
        removeNotification,
        clearAll,
        undoLastAction,
      }}
    >
      {children}

      {/* Notification container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {/* Groups */}
          {groups.map((group) => (
            <div key={group.id} className="pointer-events-auto">
              <NotificationGroupItem
                group={group}
                onRemoveNotification={removeNotification}
                onClearGroup={(groupId) => {
                  setNotifications((prev) =>
                    prev.filter((n) => n.groupId !== groupId)
                  );
                }}
              />
            </div>
          ))}

          {/* Ungrouped */}
          {ungroupedNotifications.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationItem
                notification={notification}
                onRemove={() => removeNotification(notification.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Quick notification functions
export function useQuickNotify() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, description?: string) =>
      addNotification({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addNotification({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addNotification({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addNotification({ type: 'info', title, description }),
    emailOpen: (title: string, description?: string) =>
      addNotification({ 
        type: 'email_open', 
        title, 
        description,
        groupId: 'email-opens',
      }),
    linkClick: (title: string, description?: string) =>
      addNotification({ 
        type: 'link_click', 
        title, 
        description,
        groupId: 'link-clicks',
      }),
  };
}

export default NotificationProvider;
