/**
 * Lazy Loading Configuration
 * @description Componentes com lazy loading para otimização de performance
 */
import React, { lazy, Suspense, ComponentType } from 'react';

// Lazy load heavy components
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
  fallback: React.ReactNode = null
): React.FC<P> {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}
