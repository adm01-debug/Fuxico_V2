// =============================================================================
// FUXICO - Global Notification Badge Manager
// Manages tab badge based on unread alerts count
// =============================================================================

import { useAuth } from '@/contexts/AuthContext';
import { useBounceAlerts } from '@/hooks/use-bounce-alerts';
import { useTabNotificationBadge } from '@/hooks/use-tab-badge';

function NotificationBadgeInner() {
  const { unreadCount } = useBounceAlerts();
  useTabNotificationBadge(unreadCount);
  return null;
}

export function NotificationBadgeManager() {
  const { user } = useAuth();

  // Only mount and run hooks when user is logged in
  if (!user) return null;

  return <NotificationBadgeInner />;
}
