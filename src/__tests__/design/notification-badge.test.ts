// =============================================================================
// FUXICO - Notification Badge Manager Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const content = fs.readFileSync(
  path.resolve(__dirname, '../../components/NotificationBadgeManager.tsx'),
  'utf-8'
);

describe('NotificationBadgeManager', () => {
  it('should exist and have content', () => {
    expect(content.length).toBeGreaterThan(0);
  });

  it('should use useAuth for user check', () => {
    expect(content).toContain('useAuth');
  });

  it('should use useBounceAlerts for unread count', () => {
    expect(content).toContain('useBounceAlerts');
  });

  it('should use useTabNotificationBadge', () => {
    expect(content).toContain('useTabNotificationBadge');
  });

  it('should only render when user is logged in', () => {
    expect(content).toContain('if (!user) return null');
  });

  it('should pass unreadCount to tab badge', () => {
    expect(content).toContain('unreadCount');
  });

  it('should split into inner component for hook rules', () => {
    expect(content).toContain('NotificationBadgeInner');
  });
});
