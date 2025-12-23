import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useCustomDomain,
  usePDFSecure,
  useDeliveryCertificates,
  useNoReplyAlerts,
  useHotConversations,
} from '../hooks/hooks-high-priority';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('hooks-high-priority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCustomDomain', () => {
    it('should initialize with empty domains array', () => {
      const { result } = renderHook(() => useCustomDomain(), { wrapper: createWrapper() });
      expect(result.current.domains).toEqual([]);
    });

    it('should have addDomain function', () => {
      const { result } = renderHook(() => useCustomDomain(), { wrapper: createWrapper() });
      expect(typeof result.current.addDomain).toBe('function');
    });

    it('should have verifyDomain function', () => {
      const { result } = renderHook(() => useCustomDomain(), { wrapper: createWrapper() });
      expect(typeof result.current.verifyDomain).toBe('function');
    });

    it('should have removeDomain function', () => {
      const { result } = renderHook(() => useCustomDomain(), { wrapper: createWrapper() });
      expect(typeof result.current.removeDomain).toBe('function');
    });
  });

  describe('usePDFSecure', () => {
    it('should initialize with empty settings', () => {
      const { result } = renderHook(() => usePDFSecure(), { wrapper: createWrapper() });
      expect(result.current.settings).toEqual([]);
    });

    it('should have updateSettings function', () => {
      const { result } = renderHook(() => usePDFSecure(), { wrapper: createWrapper() });
      expect(typeof result.current.updateSettings).toBe('function');
    });
  });

  describe('useDeliveryCertificates', () => {
    it('should initialize with empty certificates array', () => {
      const { result } = renderHook(() => useDeliveryCertificates(), { wrapper: createWrapper() });
      expect(result.current.certificates).toEqual([]);
    });

    it('should have generateCertificate function', () => {
      const { result } = renderHook(() => useDeliveryCertificates(), { wrapper: createWrapper() });
      expect(typeof result.current.generateCertificate).toBe('function');
    });

    it('should have verifyCertificate function', () => {
      const { result } = renderHook(() => useDeliveryCertificates(), { wrapper: createWrapper() });
      expect(typeof result.current.verifyCertificate).toBe('function');
    });
  });

  describe('useNoReplyAlerts', () => {
    it('should initialize with empty alerts array', () => {
      const { result } = renderHook(() => useNoReplyAlerts(), { wrapper: createWrapper() });
      expect(result.current.alerts).toEqual([]);
    });

    it('should have configureAlert function', () => {
      const { result } = renderHook(() => useNoReplyAlerts(), { wrapper: createWrapper() });
      expect(typeof result.current.configureAlert).toBe('function');
    });
  });

  describe('useHotConversations', () => {
    it('should initialize with empty conversations array', () => {
      const { result } = renderHook(() => useHotConversations(), { wrapper: createWrapper() });
      expect(result.current.conversations).toEqual([]);
    });

    it('should have markAsRead function', () => {
      const { result } = renderHook(() => useHotConversations(), { wrapper: createWrapper() });
      expect(typeof result.current.markAsRead).toBe('function');
    });
  });
});
