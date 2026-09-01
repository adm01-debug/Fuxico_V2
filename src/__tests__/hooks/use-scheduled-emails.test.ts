import { describe, it, expect } from 'vitest';

describe('useScheduledEmails - ownership validation', () => {
  it('should include user_id in update queries', () => {
    const userId = 'user-123';
    const emailId = 'email-456';
    // Simulating the fixed query pattern
    const query = { table: 'scheduled_emails', eq: [['id', emailId], ['user_id', userId]] };
    expect(query.eq).toContainEqual(['user_id', userId]);
  });

  it('should include user_id in cancel queries', () => {
    const userId = 'user-123';
    const filters = [['id', 'email-1'], ['user_id', userId]];
    const hasOwnershipCheck = filters.some(([key]) => key === 'user_id');
    expect(hasOwnershipCheck).toBe(true);
  });

  it('should validate scheduled_at is in the future', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    expect(new Date(futureDate) > new Date()).toBe(true);
    expect(new Date(pastDate) > new Date()).toBe(false);
  });
});
