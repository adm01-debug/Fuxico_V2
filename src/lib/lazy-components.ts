/**
 * Lazy Loading Configuration
 * @description Componentes com lazy loading
 */
import { lazy, Suspense, ComponentType } from 'react';
import { TabSkeleton } from '@/components/dashboard/TabSkeleton';

// Lazy load heavy components
export const LazyAdvancedAnalytics = lazy(() => import('@/components/dashboard/AdvancedAnalytics'));
export const LazyAuditTab = lazy(() => import('@/components/dashboard/AuditTab'));
export const LazyBitrixTab = lazy(() => import('@/components/dashboard/BitrixTab'));
export const LazyCampaignsTab = lazy(() => import('@/components/dashboard/CampaignsTab'));
export const LazyEmailFilters = lazy(() => import('@/components/dashboard/EmailFilters'));
export const LazyGeoAnalyticsTab = lazy(() => import('@/components/dashboard/GeoAnalyticsTab'));
export const LazyIntegrationsTab = lazy(() => import('@/components/dashboard/IntegrationsTab'));
export const LazyReportsTab = lazy(() => import('@/components/dashboard/ReportsTab'));

// Helper para wrap com Suspense
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback = <TabSkeleton />
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}
