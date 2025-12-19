// FUXICO PWA Utilities
// Utilitários para Progressive Web App

// ============================================
// TYPES
// ============================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[PWA] New version available');
            dispatchUpdateEvent();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[PWA] Service Worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('[PWA] Service Worker unregister failed:', error);
    return false;
  }
}

// ============================================
// INSTALL PROMPT
// ============================================

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt fired');
    e.preventDefault();
    deferredPrompt = e;
    dispatchInstallAvailableEvent();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    dispatchInstalledEvent();
  });
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt result:', outcome);
    
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
}

export function isInstalled(): boolean {
  // Check if running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // iOS Safari
  if ((navigator as any).standalone === true) {
    return true;
  }

  return false;
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);
  return permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.log('[PWA] Push not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined,
    });

    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('[PWA] Push unsubscribed:', success);
      return success;
    }
    
    return true;
  } catch (error) {
    console.error('[PWA] Push unsubscribe failed:', error);
    return false;
  }
}

// ============================================
// OFFLINE DETECTION
// ============================================

export function isOnline(): boolean {
  return navigator.onLine;
}

export function setupOfflineDetection(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('[PWA] Back online');
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('[PWA] Gone offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================
// CACHE MANAGEMENT
// ============================================

export async function clearCache(): Promise<void> {
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    console.log('[PWA] Cache cleared');
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return 0;
  }

  const estimate = await navigator.storage.estimate();
  return estimate.usage || 0;
}

// ============================================
// UPDATE MANAGEMENT
// ============================================

export async function checkForUpdates(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
}

export function skipWaiting(): void {
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

// ============================================
// CUSTOM EVENTS
// ============================================

function dispatchInstallAvailableEvent(): void {
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
}

function dispatchInstalledEvent(): void {
  window.dispatchEvent(new CustomEvent('pwa-installed'));
}

function dispatchUpdateEvent(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

// ============================================
// UTILITIES
// ============================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// ============================================
// INITIALIZATION
// ============================================

export function initPWA(): void {
  registerServiceWorker();
  setupInstallPrompt();
  
  // Log PWA status
  console.log('[PWA] Installed:', isInstalled());
  console.log('[PWA] Online:', isOnline());
  console.log('[PWA] Notifications:', getNotificationPermission());
}
