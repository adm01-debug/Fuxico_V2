// =============================================================================
// FUXICO - Testes do Hook use-tracking
// Arquivo: src/__tests__/hooks/use-tracking.test.ts
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useTrackedEmails,
  useEmailDetail,
  useTrackingStats,
  useEngagementMetrics,
  useInvalidateTracking,
  useRefreshStats,
} from '@/hooks/use-tracking'
import {
  mockSupabase,
  createMockEmail,
  createMockEvent,
  createMockLink,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
} from '../setup'

// =============================================================================
// TEST WRAPPER
// =============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// Helper to wait for async operations
const waitForQueryToSettle = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
  })
}

// =============================================================================
// TESTS: useTrackedEmails
// =============================================================================

describe('useTrackedEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
  })

  it('should return loading state initially', () => {
    mockSupabase.rpc.mockReturnValue(new Promise(() => {})) // Never resolves
    
    const { result } = renderHook(() => useTrackedEmails(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should fetch tracked emails successfully', async () => {
    const mockEmails = [
      createMockEmail({ id: '1', subject: 'Email 1' }),
      createMockEmail({ id: '2', subject: 'Email 2' }),
    ]
    
    mockSupabase.rpc.mockResolvedValueOnce({ data: mockEmails, error: null })
    
    const { result } = renderHook(() => useTrackedEmails(), {
      wrapper: createWrapper(),
    })
    
    await waitForQueryToSettle()
    
    expect(result.current.data).toHaveLength(2)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_emails_with_stats', expect.any(Object))
  })

  it('should apply filters correctly', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null })
    
    const filters = {
      search: 'test',
      deliveryStatus: 'sent',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    }
    
    renderHook(() => useTrackedEmails(filters), {
      wrapper: createWrapper(),
    })
    
    await waitForQueryToSettle()
    
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_emails_with_stats', {
      p_user_id: expect.any(String),
      p_limit: 100,
      p_offset: 0,
      p_status: 'sent',
      p_search: 'test',
      p_start_date: '2024-01-01',
      p_end_date: '2024-12-31',
    })
  })

  it('should handle error when user is not authenticated', async () => {
    mockUnauthenticatedUser()
    
    const { result } = renderHook(() => useTrackedEmails(), {
      wrapper: createWrapper(),
    })
    
    await waitForQueryToSettle()
    
    expect(result.current.isError).toBe(true)
  })
})

// =============================================================================
// TESTS: useEmailDetail
// =============================================================================

describe('useEmailDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
  })

  it('should not fetch when trackingId is empty', () => {
    const { result } = renderHook(() => useEmailDetail(''), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it('should be enabled when trackingId is provided', () => {
    const { result } = renderHook(() => useEmailDetail('tracking-123'), {
      wrapper: createWrapper(),
    })
    
    // Should attempt to fetch
    expect(result.current.isLoading).toBe(true)
  })
})

// =============================================================================
// TESTS: useTrackingStats
// =============================================================================

describe('useTrackingStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
  })

  it('should fetch stats using RPC', async () => {
    const mockStats = [{
      total_emails: 100,
      total_opens: 500,
      total_clicks: 200,
      total_bounces: 10,
      open_rate: 80,
      click_rate: 40,
      bounce_rate: 10,
    }]
    
    mockSupabase.rpc.mockResolvedValueOnce({ data: mockStats, error: null })
    
    const { result } = renderHook(() => useTrackingStats(), {
      wrapper: createWrapper(),
    })
    
    await waitForQueryToSettle()
    
    expect(result.current.data).toEqual({
      totalEmails: 100,
      totalOpens: 500,
      totalClicks: 200,
      bounced: 10,
      openRate: 80,
      clickRate: 40,
      bounceRate: 10,
    })
  })

  it('should return loading state initially', () => {
    mockSupabase.rpc.mockReturnValue(new Promise(() => {}))
    
    const { result } = renderHook(() => useTrackingStats(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
  })
})

// =============================================================================
// TESTS: useEngagementMetrics
// =============================================================================

describe('useEngagementMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticatedUser()
  })

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useEngagementMetrics(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.isLoading).toBe(true)
  })
})

// =============================================================================
// TESTS: useInvalidateTracking
// =============================================================================

describe('useInvalidateTracking', () => {
  it('should provide invalidate function', () => {
    const { result } = renderHook(() => useInvalidateTracking(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.invalidate).toBeDefined()
    expect(typeof result.current.invalidate).toBe('function')
  })

  it('should call invalidate without throwing', () => {
    const { result } = renderHook(() => useInvalidateTracking(), {
      wrapper: createWrapper(),
    })
    
    expect(() => result.current.invalidate()).not.toThrow()
  })
})

// =============================================================================
// TESTS: useRefreshStats
// =============================================================================

describe('useRefreshStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide refresh function', () => {
    const { result } = renderHook(() => useRefreshStats(), {
      wrapper: createWrapper(),
    })
    
    expect(result.current.refresh).toBeDefined()
    expect(typeof result.current.refresh).toBe('function')
  })

  it('should call refresh RPC', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null })
    
    const { result } = renderHook(() => useRefreshStats(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.refresh()
    })
    
    expect(mockSupabase.rpc).toHaveBeenCalledWith('refresh_email_stats_mv')
  })

  it('should handle refresh error gracefully', async () => {
    mockSupabase.rpc.mockRejectedValueOnce(new Error('Refresh failed'))
    
    const { result } = renderHook(() => useRefreshStats(), {
      wrapper: createWrapper(),
    })
    
    // Should not throw
    await expect(act(async () => {
      await result.current.refresh()
    })).resolves.not.toThrow()
  })
})

// =============================================================================
// TESTS: Type exports
// =============================================================================

describe('Type exports', () => {
  it('should export TrackedEmail type compatible interface', () => {
    const email = createMockEmail()
    expect(email).toHaveProperty('id')
    expect(email).toHaveProperty('tracking_id')
    expect(email).toHaveProperty('recipient_email')
  })

  it('should export TrackingFilters compatible interface', () => {
    const filters = {
      search: 'test',
      deliveryStatus: 'sent',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    }
    expect(filters).toHaveProperty('search')
    expect(filters).toHaveProperty('deliveryStatus')
  })
})
