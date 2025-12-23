import { useState, useEffect, useCallback } from 'react';
import { log } from '@/lib/logger';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      log.warn('Notifications not supported in this browser');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      log.debug('Notification permission result', { result });
      return result;
    } catch (error) {
      log.error('Error requesting notification permission', error);
      return 'denied';
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (options: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        log.debug('Cannot show notification', { isSupported, permission });
        return null;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction,
        });

        if (options.onClick) {
          notification.onclick = () => {
            window.focus();
            options.onClick?.();
            notification.close();
          };
        }

        log.debug('Notification shown', { title: options.title });
        return notification;
      } catch (error) {
        log.error('Error showing notification', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  const showEmailOpenedNotification = useCallback(
    (recipientEmail: string, subject: string) => {
      return showNotification({
        title: '📧 Email Aberto!',
        body: `${recipientEmail} abriu: ${subject}`,
        tag: `email-opened-${Date.now()}`,
        requireInteraction: false,
      });
    },
    [showNotification]
  );

  const showLinkClickedNotification = useCallback(
    (recipientEmail: string, linkUrl: string) => {
      return showNotification({
        title: '🔗 Link Clicado!',
        body: `${recipientEmail} clicou em: ${linkUrl}`,
        tag: `link-clicked-${Date.now()}`,
        requireInteraction: false,
      });
    },
    [showNotification]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showEmailOpenedNotification,
    showLinkClickedNotification,
  };
}
