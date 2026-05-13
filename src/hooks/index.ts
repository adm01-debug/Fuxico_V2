/**
 * FUXICO - Hooks Index
 * 
 * Central export for all custom hooks
 * Consolidado e organizado para fácil manutenção
 */

// =============================================================================
// CORE HOOKS
// =============================================================================
export { useUserRoles } from './use-user-roles';
export { useUserPreferences } from './use-user-preferences';

// =============================================================================
// UI HOOKS
// =============================================================================
export { useDebouncedValue, useDebouncedCallback } from './use-debounced-value';
export { useLocalStorage } from './use-local-storage';
export { 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop, 
  usePrefersDarkMode, 
  usePrefersReducedMotion 
} from './use-media-query';
export { useOnlineStatus, useNetworkStatus } from './use-online-status';
export { useKeyboardNavigation, SHORTCUTS, getKeyboardShortcutsHelp } from './use-keyboard-navigation';
export { useTabBadge, useTabNotificationBadge } from './use-tab-badge';

// =============================================================================
// TRACKING HOOKS
// =============================================================================
export { 
  useTrackedEmails, 
  useEmailDetail, 
  useTrackingStats, 
  useEngagementMetrics,
  useRefreshStats,
  useInvalidateTracking
} from '@/features/tracking/hooks/use-tracking';
export { useTrackedDocuments, useDocumentEvents } from './use-tracked-documents';
export { useTrackedLinks, useLinkClickEvents } from './use-tracked-links';
export { useTrackingTrends } from './use-tracking-trends';

// =============================================================================
// FEATURE HOOKS
// =============================================================================
export { useRealtimeNotifications } from './use-realtime-notifications';
export { useAuditConfig, useUpdateAuditConfig } from './use-audit-config';
export { useBounceAlerts } from './use-bounce-alerts';
export { useContactScores, useRecalculateScores, useUpdateContactScore } from './use-lead-scoring';
export { useDesktopNotifications } from './use-desktop-notifications';
export { useDeliverability } from './use-deliverability';
export { useGeoStats } from './use-geo-stats';
export { useAIInsights, useRefreshInsights } from './use-ai-insights';

// =============================================================================
// CAMPAIGN & ENGAGEMENT HOOKS
// =============================================================================
export { 
  useCampaigns, 
  useCreateCampaign, 
  useUpdateCampaign, 
  useDeleteCampaign,
  useAssignEmailToCampaign 
} from './use-campaigns';
export { 
  useFollowUpReminders, 
  usePendingReminders, 
  useDueReminders, 
  useCreateReminder, 
  useUpdateReminderStatus, 
  useDeleteReminder 
} from './use-follow-up-reminders';
export { useABTests } from './use-ab-tests';
export { useEmailTemplates } from './use-email-templates';
export { useScheduledEmails } from './use-scheduled-emails';
export { useScheduledReports } from './use-scheduled-reports';

// =============================================================================
// INTEGRATIONS HOOKS
// =============================================================================
export { 
  useBitrix24Config, 
  useBitrix24Activities, 
  useBitrix24Contacts,
  useBitrix24Deals,
  useSyncContact,
  useRegisterActivity,
  useCreateDeal,
  useSendNotification,
  useBitrix24Status,
  useTestBitrix24Connection
} from '@/features/crm/hooks/use-bitrix24';
export { 
  useWebhookConfig, 
  useWebhookLogs, 
  useSaveWebhookConfig, 
  useTestWebhook 
} from './use-webhook';

// =============================================================================
// SEARCH & FILTERS
// =============================================================================
export { useFulltextSearch, useEmailSearch, useDocumentSearch } from './use-fulltext-search';
export { useSavedFilters } from './use-saved-filters';

// =============================================================================
// NOTIFICATIONS & HISTORY
// =============================================================================
export { useNotificationHistory } from './use-notification-history';
export { useContactHistory } from './use-contact-history';
export { 
  useIsAdmin, 
  useEmailAuditLogs, 
  useFraudAlerts, 
  useResolveAlert, 
  useAuditStats, 
  useUserActivitySummary 
} from '@/features/audit/hooks/use-email-audit';
export { useUnsubscribedEmails } from './use-unsubscribed-emails';

// =============================================================================
// SEQUENCES
// =============================================================================
export { useEmailSequences } from './useEmailSequences';
export { useSequenceStats } from './useSequenceStats';
export { useSequenceWebhookLogs } from './useSequenceWebhookLogs';

// =============================================================================
// DASHBOARD
// =============================================================================
export { useDashboardWidgets } from './use-dashboard-widgets';

// =============================================================================
// TOAST
// =============================================================================
export { useToast, toast } from './use-toast';
