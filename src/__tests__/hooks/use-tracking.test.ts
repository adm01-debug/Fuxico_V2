// =============================================================================
// FUXICO - Testes do Hook use-tracking
// Arquivo: src/__tests__/hooks/use-tracking.test.ts
// Descrição: Testes unitários para o hook de tracking de emails
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Tipos para os mocks
interface MockEmail {
  id: string
  tracking_id: string
  recipient_email: string
  subject: string
  sender_email: string
  created_at: string
  metadata: Record<string, unknown>
  delivery_status: string
  bounce_type: string | null
  bounce_reason: string | null
  bounce_detected_at: string | null
  opens: number
  clicks: number
  self_opens: number
  unique_opens: number
  first_opened_at: string | null
  last_opened_at: string | null
}

// Mock do supabase
const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

// Import após mock
import { 
  useTrackedEmails, 
  useTrackedEmailsInfinite,
  useTrackingStats,
  formatEmailDisplay,
  calculateOpenRate,
} from '@/hooks/use-tracking'
import type { TrackedEmail } from '@/hooks/use-tracking'

// =============================================================================
// DADOS DE TESTE
// =============================================================================

const mockEmails: MockEmail[] = [
  {
    id: 'email-1',
    tracking_id: 'track-123',
    recipient_email: 'user@example.com',
    subject: 'Test Email',
    sender_email: 'sender@example.com',
    created_at: '2024-12-19T10:00:00Z',
    metadata: {},
    delivery_status: 'delivered',
    bounce_type: null,
    bounce_reason: null,
    bounce_detected_at: null,
    opens: 5,
    clicks: 2,
    self_opens: 1,
    unique_opens: 3,
    first_opened_at: '2024-12-19T11:00:00Z',
    last_opened_at: '2024-12-19T15:00:00Z',
  },
  {
    id: 'email-2',
    tracking_id: 'track-456',
    recipient_email: 'another@example.com',
    subject: 'Another Email',
    sender_email: 'sender@example.com',
    created_at: '2024-12-18T10:00:00Z',
    metadata: {},
    delivery_status: 'delivered',
    bounce_type: null,
    bounce_reason: null,
    bounce_detected_at: null,
    opens: 0,
    clicks: 0,
    self_opens: 0,
    unique_opens: 0,
    first_opened_at: null,
    last_opened_at: null,
  },
]

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

// =============================================================================
// HELPERS
// =============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
}

// =============================================================================
// TESTES
// =============================================================================

describe('use-tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    
    mockRpc.mockResolvedValue({
      data: mockEmails,
      error: null,
    })
  })
  
  // =========================================================================
  // useTrackedEmails
  // =========================================================================
  
  describe('useTrackedEmails', () => {
    it('deve buscar emails com sucesso', async () => {
      const { result } = renderHook(
        () => useTrackedEmails(),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      expect(result.current.data?.data).toHaveLength(2)
      expect(result.current.data?.data[0].tracking_id).toBe('track-123')
    })
    
    it('deve chamar RPC com parâmetros corretos', async () => {
      renderHook(
        () => useTrackedEmails({ deliveryStatus: 'delivered' }, 0, 25),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('get_emails_with_stats', {
          p_user_id: 'user-123',
          p_limit: 26, // +1 para detectar has_more
          p_offset: 0,
          p_delivery_status: 'delivered',
        })
      })
    })
    
    it('deve filtrar por busca textual', async () => {
      const { result } = renderHook(
        () => useTrackedEmails({ search: 'another' }),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      // Apenas o email com "another" deve ser retornado
      expect(result.current.data?.data).toHaveLength(1)
      expect(result.current.data?.data[0].recipient_email).toBe('another@example.com')
    })
    
    it('deve lidar com erro de autenticação', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
      
      const { result } = renderHook(
        () => useTrackedEmails(),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
      
      expect(result.current.error?.message).toBe('User not authenticated')
    })
    
    it('deve lidar com erro da RPC', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB001' },
      })
      
      const { result } = renderHook(
        () => useTrackedEmails(),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
    
    it('deve calcular has_more corretamente', async () => {
      // Simular mais emails que o limite
      const manyEmails = Array.from({ length: 51 }, (_, i) => ({
        ...mockEmails[0],
        id: `email-${i}`,
        tracking_id: `track-${i}`,
      }))
      
      mockRpc.mockResolvedValue({
        data: manyEmails,
        error: null,
      })
      
      const { result } = renderHook(
        () => useTrackedEmails({}, 0, 50),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      expect(result.current.data?.pagination.has_more).toBe(true)
      expect(result.current.data?.data).toHaveLength(50)
    })
  })
  
  // =========================================================================
  // useTrackedEmailsInfinite
  // =========================================================================
  
  describe('useTrackedEmailsInfinite', () => {
    it('deve buscar primeira página', async () => {
      const { result } = renderHook(
        () => useTrackedEmailsInfinite(),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].data).toHaveLength(2)
    })
    
    it('deve retornar hasNextPage baseado em cursor', async () => {
      const emailsWithMore = [...mockEmails]
      // Adicionar mais para ter próxima página
      for (let i = 0; i < 50; i++) {
        emailsWithMore.push({
          ...mockEmails[0],
          id: `email-extra-${i}`,
          tracking_id: `track-extra-${i}`,
        })
      }
      
      mockRpc.mockResolvedValue({
        data: emailsWithMore,
        error: null,
      })
      
      const { result } = renderHook(
        () => useTrackedEmailsInfinite({}, 50),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      expect(result.current.hasNextPage).toBe(true)
    })
  })
  
  // =========================================================================
  // useTrackingStats
  // =========================================================================
  
  describe('useTrackingStats', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { opens: 5, clicks: 2, unique_opens: 3, delivery_status: 'delivered' },
            { opens: 10, clicks: 5, unique_opens: 7, delivery_status: 'delivered' },
            { opens: 0, clicks: 0, unique_opens: 0, delivery_status: 'bounced' },
          ],
          error: null,
        }),
      })
    })
    
    it('deve agregar estatísticas corretamente', async () => {
      const { result } = renderHook(
        () => useTrackingStats(),
        { wrapper: createWrapper() }
      )
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
      
      expect(result.current.data).toEqual({
        totalEmails: 3,
        totalOpens: 15,
        totalClicks: 7,
        uniqueOpens: 10,
        bounced: 1,
      })
    })
  })
  
  // =========================================================================
  // Funções Utilitárias
  // =========================================================================
  
  describe('formatEmailDisplay', () => {
    it('deve formatar email lido', () => {
      const email: TrackedEmail = {
        ...mockEmails[0] as TrackedEmail,
      }
      
      const result = formatEmailDisplay(email)
      
      expect(result).toEqual({
        title: 'Test Email',
        subtitle: 'user@example.com',
        status: 'read',
      })
    })
    
    it('deve formatar email não lido', () => {
      const email: TrackedEmail = {
        ...mockEmails[1] as TrackedEmail,
      }
      
      const result = formatEmailDisplay(email)
      
      expect(result.status).toBe('unread')
    })
    
    it('deve formatar email bounced', () => {
      const email: TrackedEmail = {
        ...mockEmails[0] as TrackedEmail,
        delivery_status: 'bounced',
      }
      
      const result = formatEmailDisplay(email)
      
      expect(result.status).toBe('bounced')
    })
    
    it('deve lidar com assunto vazio', () => {
      const email: TrackedEmail = {
        ...mockEmails[0] as TrackedEmail,
        subject: '',
      }
      
      const result = formatEmailDisplay(email)
      
      expect(result.title).toBe('(Sem assunto)')
    })
  })
  
  describe('calculateOpenRate', () => {
    it('deve retornar 100% para email aberto', () => {
      const email: TrackedEmail = {
        ...mockEmails[0] as TrackedEmail,
        opens: 1,
      }
      
      expect(calculateOpenRate(email)).toBe(100)
    })
    
    it('deve retornar 0% para email não aberto', () => {
      const email: TrackedEmail = {
        ...mockEmails[1] as TrackedEmail,
      }
      
      expect(calculateOpenRate(email)).toBe(0)
    })
    
    it('deve retornar 0% para email bounced', () => {
      const email: TrackedEmail = {
        ...mockEmails[0] as TrackedEmail,
        delivery_status: 'bounced',
        opens: 5,
      }
      
      expect(calculateOpenRate(email)).toBe(0)
    })
  })
})
