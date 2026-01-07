/**
 * Route Prefetch Utility
 * Prefetches route components for faster navigation
 * @module lib/route-prefetch
 */

// =============================================================================
// FUXICO - Enhanced Route Prefetching System
// =============================================================================

type PrefetchCallback = () => Promise<any>;

interface PrefetchConfig {
  id: string;
  loader: PrefetchCallback;
  priority: 'high' | 'medium' | 'low';
  prefetched: boolean;
}

class RoutePrefetcher {
  private routes: Map<string, PrefetchConfig> = new Map();
  private prefetchQueue: string[] = [];
  private isProcessing = false;
  private idleCallbackId: number | null = null;

  register(id: string, loader: PrefetchCallback, priority: 'high' | 'medium' | 'low' = 'medium') {
    if (this.routes.has(id)) return;
    this.routes.set(id, { id, loader, priority, prefetched: false });
  }

  async prefetch(id: string): Promise<void> {
    const route = this.routes.get(id);
    if (!route || route.prefetched) return;

    try {
      await route.loader();
      route.prefetched = true;
    } catch (error) {
      console.warn(`[Prefetch] Failed to prefetch "${id}"`);
    }
  }

  schedule(ids: string[]) {
    ids.forEach(id => {
      if (!this.prefetchQueue.includes(id)) {
        this.prefetchQueue.push(id);
      }
    });
    this.processQueue();
  }

  private processQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;

    if ('requestIdleCallback' in window) {
      this.idleCallbackId = window.requestIdleCallback(
        (deadline) => this.processBatch(deadline),
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => this.processBatch(), 100);
    }
  }

  private async processBatch(deadline?: IdleDeadline) {
    this.isProcessing = true;

    while (this.prefetchQueue.length > 0) {
      if (deadline && deadline.timeRemaining() < 10) break;
      const id = this.prefetchQueue.shift();
      if (id) await this.prefetch(id);
    }

    this.isProcessing = false;
    if (this.prefetchQueue.length > 0) this.processQueue();
  }

  prefetchOnHover(id: string) {
    const route = this.routes.get(id);
    if (!route || route.prefetched) return;
    this.prefetch(id);
  }

  prefetchAdjacent(currentId: string, adjacentIds: string[]) {
    const toPrefetch = adjacentIds
      .filter(id => {
        const route = this.routes.get(id);
        return route && !route.prefetched;
      })
      .sort((a, b) => {
        const routeA = this.routes.get(a);
        const routeB = this.routes.get(b);
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[routeA?.priority || 'low'] - priorityOrder[routeB?.priority || 'low']);
      });

    this.schedule(toPrefetch);
  }

  cleanup() {
    if (this.idleCallbackId !== null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleCallbackId);
    }
  }

  getStatus() {
    let prefetched = 0;
    this.routes.forEach(route => { if (route.prefetched) prefetched++; });
    return { total: this.routes.size, prefetched, pending: this.prefetchQueue.length };
  }
}

export const routePrefetcher = new RoutePrefetcher();

// Dashboard tab registration
export function registerDashboardRoutes() {
  routePrefetcher.register('home', () => import('@/components/dashboard/DashboardHome'), 'high');
  routePrefetcher.register('emails', () => import('@/components/dashboard/EmailTable'), 'high');
  routePrefetcher.register('analytics', () => import('@/components/dashboard/AdvancedAnalytics'), 'high');
  routePrefetcher.register('links', () => import('@/components/dashboard/LinksTab'), 'medium');
  routePrefetcher.register('documents', () => import('@/components/dashboard/DocumentsTab'), 'medium');
  routePrefetcher.register('leads', () => import('@/components/dashboard/LeadScoringTab'), 'medium');
  routePrefetcher.register('campaigns', () => import('@/components/dashboard/CampaignsTab'), 'medium');
  routePrefetcher.register('reports', () => import('@/components/dashboard/ReportsTab'), 'low');
  routePrefetcher.register('templates', () => import('@/components/dashboard/TemplatesTab'), 'low');
}

export const adjacentRoutes: Record<string, string[]> = {
  home: ['emails', 'analytics', 'campaigns'],
  emails: ['home', 'analytics', 'leads'],
  analytics: ['emails', 'campaigns'],
  links: ['documents', 'emails'],
  documents: ['links', 'emails'],
  leads: ['emails', 'campaigns'],
  campaigns: ['analytics', 'leads'],
};

// Legacy exports for compatibility
const routeModules = {
  dashboard: () => import('@/pages/Dashboard'),
  settings: () => import('@/pages/Settings'),
  auth: () => import('@/pages/Auth'),
};

type RouteKey = keyof typeof routeModules;

export function prefetchRoute(route: RouteKey): void {
  const module = routeModules[route];
  if (module) module().catch(() => {});
}

export function prefetchAllRoutes(): void {
  Object.values(routeModules).forEach((module) => module().catch(() => {}));
}

export function setupLinkPrefetch(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a[href]');
    
    if (link) {
      const href = link.getAttribute('href');
      if (href?.startsWith('/')) {
        const route = href.slice(1).split('/')[0] as RouteKey;
        if (route in routeModules) prefetchRoute(route);
      }
    }
  }, { passive: true });
}

export function prefetchOnIdle(): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => prefetchAllRoutes(), { timeout: 2000 });
  } else {
    setTimeout(prefetchAllRoutes, 2000);
  }
}

// React hook
import { useEffect, useCallback } from 'react';

export function useRoutePrefetch() {
  useEffect(() => {
    registerDashboardRoutes();
    routePrefetcher.schedule(['home', 'emails', 'analytics']);
    return () => routePrefetcher.cleanup();
  }, []);

  const prefetchOnHover = useCallback((routeId: string) => {
    routePrefetcher.prefetchOnHover(routeId);
  }, []);

  const prefetchAdjacent = useCallback((currentId: string) => {
    const adjacent = adjacentRoutes[currentId] || [];
    routePrefetcher.prefetchAdjacent(currentId, adjacent);
  }, []);

  return { prefetchOnHover, prefetchAdjacent, getStatus: () => routePrefetcher.getStatus() };
}

export default {
  route: prefetchRoute,
  all: prefetchAllRoutes,
  setupHover: setupLinkPrefetch,
  onIdle: prefetchOnIdle,
};
