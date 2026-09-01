// FUXICO Service Worker
// Versão 2.0.0 - Enhanced Offline Support

const CACHE_VERSION = 2;
const CACHE_NAME = `fuxico-cache-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `fuxico-runtime-v${CACHE_VERSION}`;
const API_CACHE = `fuxico-api-v${CACHE_VERSION}`;
const DATA_CACHE = `fuxico-data-v${CACHE_VERSION}`;

// Assets to cache on install (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache for offline
const CACHEABLE_API_PATTERNS = [
  /\/rest\/v1\/tracked_emails/,
  /\/rest\/v1\/tracking_events/,
  /\/rest\/v1\/user_preferences/,
  /\/rest\/v1\/tracked_links/,
  /\/rest\/v1\/tracked_documents/,
];

// Max age for different cache types (in ms)
const CACHE_MAX_AGE = {
  api: 5 * 60 * 1000,      // 5 minutes for API data
  static: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  runtime: 60 * 60 * 1000,  // 1 hour for runtime cache
};

// ============================================
// INSTALL EVENT
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Precache complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// ============================================
// ACTIVATE EVENT
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('fuxico-') && 
                     !name.endsWith(`-v${CACHE_VERSION}`);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH STRATEGIES
// ============================================

// Cache First with Network Fallback (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Check if cache is still valid
    const cachedDate = cachedResponse.headers.get('sw-cached-at');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      if (age > CACHE_MAX_AGE.static) {
        // Cache expired, fetch new
        return fetchAndCache(request, CACHE_NAME);
      }
    }
    return cachedResponse;
  }
  
  return fetchAndCache(request, CACHE_NAME);
}

// Network First with Cache Fallback (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseToCache = networkResponse.clone();
      caches.open(API_CACHE).then((cache) => {
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });
        cache.put(request, cachedResponse);
      });
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to response
      console.log('[SW] Serving from cache (offline)');
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      offline: true,
      message: 'Você está offline. Os dados serão sincronizados quando a conexão for restaurada.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate (for semi-dynamic content)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Helper to fetch and cache with timestamp
async function fetchAndCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch and cache failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Check if URL matches cacheable API patterns
function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url));
}

// ============================================
// FETCH EVENT
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip websocket upgrades
  if (request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // Supabase API requests - Network first with caching for specific endpoints
  if (url.hostname.includes('supabase') || url.pathname.includes('/functions/v1/')) {
    if (isCacheableAPI(url.pathname)) {
      event.respondWith(networkFirstStrategy(request));
    } else {
      // For non-cacheable API endpoints, just try network
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
    }
    return;
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
        .then(response => response || caches.match('/index.html'))
    );
    return;
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = { title: 'FUXICO', body: 'Nova notificação' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Ver Detalhes' },
      { action: 'close', title: 'Fechar' },
    ],
    tag: data.tag || 'fuxico-notification',
    renotify: true,
    requireInteraction: data.important || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-tracking-data') {
    event.waitUntil(syncTrackingData());
  }
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncTrackingData() {
  console.log('[SW] Syncing tracking data...');
  
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    for (const item of pendingData) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        
        // Remove from pending after success
        await removePendingItem(item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncPendingRequests() {
  console.log('[SW] Syncing pending requests...');
  // Implementation for syncing any pending POST/PUT requests
}

// Placeholder functions for IndexedDB operations
async function getPendingData() {
  // Would implement IndexedDB read here
  return [];
}

async function removePendingItem(id) {
  // Would implement IndexedDB delete here
}

// ============================================
// PERIODIC BACKGROUND SYNC
// ============================================

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-stats') {
    event.waitUntil(refreshCachedStats());
  }
});

async function refreshCachedStats() {
  console.log('[SW] Refreshing cached stats...');
  
  try {
    // Refresh important cached data
    const cache = await caches.open(API_CACHE);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (request.url.includes('tracking_stats') || request.url.includes('user_preferences')) {
        try {
          const freshResponse = await fetch(request);
          if (freshResponse.ok) {
            await cache.put(request, freshResponse);
          }
        } catch (e) {
          console.log('[SW] Could not refresh:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Refresh stats failed:', error);
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_DATA') {
    const { key, data } = event.data;
    event.waitUntil(
      caches.open(DATA_CACHE).then((cache) => {
        const response = new Response(JSON.stringify(data), {
          headers: { 
            'Content-Type': 'application/json',
            'sw-cached-at': Date.now().toString(),
          },
        });
        return cache.put(key, response);
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      Promise.all([
        caches.keys(),
        navigator.storage?.estimate?.() || Promise.resolve({ usage: 0, quota: 0 }),
      ]).then(([cacheNames, estimate]) => {
        event.ports[0]?.postMessage({
          caches: cacheNames,
          usage: estimate.usage,
          quota: estimate.quota,
          version: CACHE_VERSION,
        });
      })
    );
  }
});

console.log('[SW] Service Worker v' + CACHE_VERSION + ' loaded');
