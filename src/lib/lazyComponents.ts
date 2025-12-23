import { lazy } from 'react';

// Dashboard Tabs - Lazy loaded para melhor performance
export const LazyAuditTab = lazy(() => import('@/components/dashboard/AuditTab'));
export const LazyBitrixTab = lazy(() => import('@/components/dashboard/BitrixTab'));
export const LazyEmailFilters = lazy(() => import('@/components/dashboard/EmailFilters'));
export const LazyExportDialog = lazy(() => import('@/components/dashboard/ExportDialog'));
export const LazyDocumentsTab = lazy(() => import('@/components/dashboard/DocumentsTab'));
export const LazyTemplatesTab = lazy(() => import('@/components/dashboard/TemplatesTab'));
export const LazyEmailDetail = lazy(() => import('@/components/dashboard/EmailDetail'));
export const LazyLinksTab = lazy(() => import('@/components/dashboard/LinksTab'));
export const LazyUserRolesTab = lazy(() => import('@/components/dashboard/UserRolesTab'));
export const LazyAuditConfigTab = lazy(() => import('@/components/dashboard/AuditConfigTab'));
export const LazyReportsTab = lazy(() => import('@/components/dashboard/ReportsTab'));
export const LazyEmailTable = lazy(() => import('@/components/dashboard/EmailTable'));

// Skeleton loader para Suspense fallback
export { default as TabSkeleton } from '@/components/dashboard/TabSkeleton';
