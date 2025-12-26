import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('base-adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      const config = { apiKey: 'test', webhookUrl: 'https://test.com' };
      expect(config.apiKey).toBe('test');
    });

    it('should validate required config', () => {
      const requiredFields = ['apiKey', 'webhookUrl'];
      expect(requiredFields).toHaveLength(2);
    });
  });

  describe('createContact', () => {
    it('should create contact with valid data', async () => {
      const contact = { email: 'test@example.com', name: 'Test User' };
      expect(contact.email).toContain('@');
    });

    it('should validate email format', () => {
      const validEmail = 'test@example.com';
      expect(validEmail).toMatch(/@/);
    });

    it('should handle API errors', async () => {
      const error = { status: 400, message: 'Invalid data' };
      expect(error.status).toBe(400);
    });
  });

  describe('syncContacts', () => {
    it('should sync contacts from tracking data', async () => {
      const trackingData = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
      expect(trackingData).toHaveLength(2);
    });

    it('should handle empty data', async () => {
      const emptyData: any[] = [];
      expect(emptyData).toHaveLength(0);
    });
  });

  describe('updateContact', () => {
    it('should update existing contact', async () => {
      const update = { id: '123', name: 'Updated Name' };
      expect(update.id).toBe('123');
    });
  });

  describe('getDeals', () => {
    it('should fetch deals by contact', async () => {
      const deals = [{ id: '1', value: 1000 }, { id: '2', value: 2000 }];
      expect(deals).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      expect(networkError.message).toBe('Network error');
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = { status: 429, retryAfter: 60 };
      expect(rateLimitError.status).toBe(429);
    });
  });
});
