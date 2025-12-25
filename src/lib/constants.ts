/**
 * Application Constants
 * 
 * @description Centralized constants for the FUXICO application.
 */

/** API Configuration */
export const API = {
  BASE_URL: import.meta.env.VITE_SUPABASE_URL,
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
} as const;

/** Query Configuration */
export const QUERY = {
  STALE_TIME: 60_000, // 1 minute
  GC_TIME: 300_000, // 5 minutes
  REFETCH_INTERVAL: 120_000, // 2 minutes
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500
} as const;

/** Tracking Configuration */
export const TRACKING = {
  PIXEL_SIZE: 1,
  SELF_OPEN_THRESHOLD_MS: 5000,
  DEBOUNCE_MS: 300
} as const;

/** Pagination */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
  MAX_PAGE_SIZE: 100
} as const;

/** Date Formats */
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  API: 'yyyy-MM-dd'
} as const;

/** Status Colors */
export const STATUS_COLORS = {
  opened: 'text-green-500',
  clicked: 'text-blue-500',
  bounced: 'text-red-500',
  pending: 'text-yellow-500',
  delivered: 'text-emerald-500'
} as const;

/** Export Formats */
export const EXPORT_FORMATS = ['csv', 'json', 'pdf'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

/** Feature Flags */
export const FEATURES = {
  BITRIX24_INTEGRATION: true,
  DOCUMENT_TRACKING: true,
  FRAUD_DETECTION: true,
  REAL_TIME_NOTIFICATIONS: true,
  DARK_MODE: true
} as const;
