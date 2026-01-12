/**
 * FUXICO - Hooks Index
 * 
 * Central export for all custom hooks
 */

// Core hooks
export { useUserRoles } from './use-user-roles';
export { useUserPreferences } from './use-user-preferences';

// UI hooks
export { useDebouncedValue, useDebouncedCallback } from './use-debounced-value';
export { useLocalStorage } from './use-local-storage';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, usePrefersDarkMode, usePrefersReducedMotion } from './use-media-query';
export { useOnlineStatus, useNetworkStatus } from './use-online-status';
export { useKeyboardNavigation, SHORTCUTS, getKeyboardShortcutsHelp } from './use-keyboard-navigation';

// Feature hooks
export { useRealtimeNotifications } from './use-realtime-notifications';
export { useTrackedDocuments } from './use-tracked-documents';
export { useTrackedLinks } from './use-tracked-links';
export { useTrackingTrends } from './use-tracking-trends';
export { useAuditConfig, useUpdateAuditConfig } from './use-audit-config';
export { useBounceAlerts } from './use-bounce-alerts';
export { useContactScores, useRecalculateScores, useUpdateContactScore } from './use-lead-scoring';
export { useDesktopNotifications } from './use-desktop-notifications';

// Toast
export { useToast, toast } from './use-toast';
