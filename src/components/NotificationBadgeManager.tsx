// =============================================================================
// FUXICO - Global Notification Badge Manager
// Manages tab badge based on unread alerts count
// =============================================================================

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBounceAlerts } from '@/hooks/use-bounce-alerts';
import { useTabNotificationBadge } from '@/hooks/use-tab-badge';

export function NotificationBadgeManager() {
  const { user } = useAuth();
  const { unreadCount } = useBounceAlerts();

  // Only show badge when user is logged in
  const badgeCount = user ? unreadCount : 0;
  
  useTabNotificationBadge(badgeCount);

  return null; // This component only manages side effects
}
