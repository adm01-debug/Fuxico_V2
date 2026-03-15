import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for prefetching routes/components based on user hover behavior
 * Uses requestIdleCallback to avoid blocking the main thread
 */

// Track which modules have been prefetched
const prefetchedModules = new Set<string>();

const ROUTE_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  emails: () => import('@/components/dashboard/EmailTable'),
  links: () => import('@/components/dashboard/LinksTab'),
  documents: () => import('@/components/dashboard/DocumentsTab'),
  reports: () => import('@/components/dashboard/ReportsTab'),
  templates: () => import('@/components/dashboard/TemplatesTab'),
  leads: () => import('@/components/dashboard/LeadScoringTab'),
  campaigns: () => import('@/components/dashboard/CampaignsTab'),
  abtesting: () => import('@/components/dashboard/ABTestingTab'),
  sequences: () => import('@/components/dashboard/SequencesTab'),
  deliverability: () => import('@/components/dashboard/DeliverabilityTab'),
  geo: () => import('@/components/dashboard/GeoAnalyticsTab'),
  trends: () => import('@/components/dashboard/TrendPredictionTab'),
  featureflags: () => import('@/components/dashboard/FeatureFlagsTab'),
};

export function usePrefetchRoute() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const prefetch = useCallback((routeId: string) => {
    if (prefetchedModules.has(routeId)) return;

    const loader = ROUTE_MODULE_MAP[routeId];
    if (!loader) return;

    // Cancel any pending prefetch
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Delay prefetch slightly to avoid unnecessary loads on quick mouse movements
    timeoutRef.current = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          loader().then(() => prefetchedModules.add(routeId)).catch(() => {});
        });
      } else {
        loader().then(() => prefetchedModules.add(routeId)).catch(() => {});
      }
    }, 200);
  }, []);

  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { prefetch, cancelPrefetch };
}
