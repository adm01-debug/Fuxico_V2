/**
 * Route Prefetch Utility
 * Prefetches route components for faster navigation
 * @module lib/route-prefetch
 */

// Lazy component imports for prefetching
const routeModules = {
  dashboard: () => import('@/pages/Dashboard'),
  settings: () => import('@/pages/Settings'),
  auth: () => import('@/pages/Auth'),
};

type RouteKey = keyof typeof routeModules;

// Prefetch a specific route
export function prefetchRoute(route: RouteKey): void {
  const module = routeModules[route];
  if (module) {
    module().catch(() => {
      // Silently fail - prefetch is optional
    });
  }
}

// Prefetch all routes
export function prefetchAllRoutes(): void {
  Object.values(routeModules).forEach((module) => {
    module().catch(() => {});
  });
}

// Prefetch on link hover
export function setupLinkPrefetch(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]');
    
    if (link) {
      const href = link.getAttribute('href');
      if (href?.startsWith('/')) {
        const route = href.slice(1).split('/')[0] as RouteKey;
        if (route in routeModules) {
          prefetchRoute(route);
        }
      }
    }
  }, { passive: true });
}

// Prefetch on idle
export function prefetchOnIdle(): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchAllRoutes();
    }, { timeout: 2000 });
  } else {
    // Fallback for Safari
    setTimeout(prefetchAllRoutes, 2000);
  }
}

export default {
  route: prefetchRoute,
  all: prefetchAllRoutes,
  setupHover: setupLinkPrefetch,
  onIdle: prefetchOnIdle,
};
