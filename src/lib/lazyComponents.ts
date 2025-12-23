import { lazy } from 'react';

// Dashboard Core Components
export const DashboardHome = lazy(() => import('@/components/dashboard/DashboardHome'));
export const EmailTable = lazy(() => import('@/components/dashboard/EmailTable'));
export const EmailDetail = lazy(() => import('@/components/dashboard/EmailDetail'));
export const EmailFilters = lazy(() => import('@/components/dashboard/EmailFilters'));
export const StatsCard = lazy(() => import('@/components/dashboard/StatsCard'));
export const TrendChart = lazy(() => import('@/components/dashboard/TrendChart'));
export const TabSkeleton = lazy(() => import('@/components/dashboard/TabSkeleton'));
export const OpenTimeHeatmap = lazy(() => import('@/components/dashboard/OpenTimeHeatmap'));

// Dialogs
export const CreateTrackingDialog = lazy(() => import('@/components/dashboard/CreateTrackingDialog'));
export const ExportDialog = lazy(() => import('@/components/dashboard/ExportDialog'));
export const ContactHistoryDialog = lazy(() => import('@/components/dashboard/ContactHistoryDialog'));
export const DocumentUploadDialog = lazy(() => import('@/components/dashboard/DocumentUploadDialog'));
export const LinkCreateDialog = lazy(() => import('@/components/dashboard/LinkCreateDialog'));

// Original Tabs (Lovable)
export const AuditTab = lazy(() => import('@/components/dashboard/AuditTab'));
export const AuditConfigTab = lazy(() => import('@/components/dashboard/AuditConfigTab'));
export const BitrixTab = lazy(() => import('@/components/dashboard/BitrixTab'));
export const DocumentsTab = lazy(() => import('@/components/dashboard/DocumentsTab'));
export const LinksTab = lazy(() => import('@/components/dashboard/LinksTab'));
export const ReportsTab = lazy(() => import('@/components/dashboard/ReportsTab'));
export const TemplatesTab = lazy(() => import('@/components/dashboard/TemplatesTab'));
export const UserRolesTab = lazy(() => import('@/components/dashboard/UserRolesTab'));
export const WebhookTab = lazy(() => import('@/components/dashboard/WebhookTab'));
export const UnsubscribeTab = lazy(() => import('@/components/dashboard/UnsubscribeTab'));

// Feature Tabs (Lovable)
export const ABTestingTab = lazy(() => import('@/components/dashboard/ABTestingTab'));
export const AdvancedAnalytics = lazy(() => import('@/components/dashboard/AdvancedAnalytics'));
export const BounceAlertsTab = lazy(() => import('@/components/dashboard/BounceAlertsTab'));
export const CampaignsTab = lazy(() => import('@/components/dashboard/CampaignsTab'));
export const DeliverabilityTab = lazy(() => import('@/components/dashboard/DeliverabilityTab'));
export const EmailSchedulingTab = lazy(() => import('@/components/dashboard/EmailSchedulingTab'));
export const FollowUpTab = lazy(() => import('@/components/dashboard/FollowUpTab'));
export const GeoAnalyticsTab = lazy(() => import('@/components/dashboard/GeoAnalyticsTab'));
export const InsightsTab = lazy(() => import('@/components/dashboard/InsightsTab'));
export const LeadScoringTab = lazy(() => import('@/components/dashboard/LeadScoringTab'));
export const NotificationHistoryTab = lazy(() => import('@/components/dashboard/NotificationHistoryTab'));

// New Feature Tabs (Claude - 27 Improvements)
export const MailMergeTab = lazy(() => import('@/components/dashboard/MailMergeTab'));
export const MassEmailTab = lazy(() => import('@/components/dashboard/MassEmailTab'));
export const ZapierTab = lazy(() => import('@/components/dashboard/ZapierTab'));
export const PDFAnalyticsTab = lazy(() => import('@/components/dashboard/PDFAnalyticsTab'));
export const ESignatureTab = lazy(() => import('@/components/dashboard/ESignatureTab'));
export const ScreenRecordingTab = lazy(() => import('@/components/dashboard/ScreenRecordingTab'));
export const WatermarkTab = lazy(() => import('@/components/dashboard/WatermarkTab'));
export const MobileSettingsTab = lazy(() => import('@/components/dashboard/MobileSettingsTab'));
export const OutlookTab = lazy(() => import('@/components/dashboard/OutlookTab'));
export const NativeCRMTab = lazy(() => import('@/components/dashboard/NativeCRMTab'));
export const ProductivityReportsTab = lazy(() => import('@/components/dashboard/ProductivityReportsTab'));
export const CTATrackingTab = lazy(() => import('@/components/dashboard/CTATrackingTab'));
export const CustomDomainTab = lazy(() => import('@/components/dashboard/CustomDomainTab'));
export const PDFSecureTab = lazy(() => import('@/components/dashboard/PDFSecureTab'));
export const DeliveryCertificatesTab = lazy(() => import('@/components/dashboard/DeliveryCertificatesTab'));
export const NoReplyAlertsTab = lazy(() => import('@/components/dashboard/NoReplyAlertsTab'));
export const HotConversationsTab = lazy(() => import('@/components/dashboard/HotConversationsTab'));
export const PollsTab = lazy(() => import('@/components/dashboard/PollsTab'));
export const TeamBillingTab = lazy(() => import('@/components/dashboard/TeamBillingTab'));
export const ReplyMonitorTab = lazy(() => import('@/components/dashboard/ReplyMonitorTab'));
export const IncomingTrackerTab = lazy(() => import('@/components/dashboard/IncomingTrackerTab'));
export const ActivityDashboard = lazy(() => import('@/components/dashboard/ActivityDashboard'));
export const SignatureGeneratorTab = lazy(() => import('@/components/dashboard/SignatureGeneratorTab'));
