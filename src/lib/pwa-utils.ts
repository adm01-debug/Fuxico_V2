import { log } from './logger';

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              log.info('New content available, please refresh');
              window.dispatchEvent(new CustomEvent('swUpdate'));
            }
          });
        }
      });

      log.debug('Service Worker registered successfully');
      return registration;
    } catch (error) {
      log.error('Service Worker registration failed', error);
      return null;
    }
  }
  return null;
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      log.info('Service Workers unregistered');
      return true;
    } catch (error) {
      log.error('Failed to unregister Service Workers', error);
      return false;
    }
  }
  return false;
}

export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

export async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      log.debug('Checked for SW updates');
    } catch (error) {
      log.error('Failed to check for updates', error);
    }
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    log.warn('Notifications not supported');
    return Promise.resolve('denied');
  }
  
  return Notification.requestPermission().then(permission => {
    log.debug('Notification permission', { permission });
    return permission;
  });
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, options);
      log.debug('Notification shown', { title });
    } catch (error) {
      log.error('Failed to show notification', error);
    }
  }
}

export async function subscribeToPush(registration: ServiceWorkerRegistration, vapidKey: string) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    log.info('Push subscription created');
    return subscription;
  } catch (error) {
    log.error('Failed to subscribe to push', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function clearCache() {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      log.info('All caches cleared');
      return true;
    } catch (error) {
      log.error('Failed to clear caches', error);
      return false;
    }
  }
  return false;
}
