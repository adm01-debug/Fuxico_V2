// =============================================================================
// FUXICO - Setup Global de Testes
// Arquivo: src/__tests__/setup.ts
// Descrição: Configuração e mocks globais para testes
// =============================================================================

import '@testing-library/jest-dom/vitest'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// =============================================================================
// CLEANUP AUTOMÁTICO
// =============================================================================

// Limpar DOM após cada teste
afterEach(() => {
  cleanup()
})

// =============================================================================
// MOCKS GLOBAIS
// =============================================================================

// Mock do matchMedia (necessário para componentes responsivos)
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Mock do ResizeObserver
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

// Mock do IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))
})

// Mock do scrollTo
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

// =============================================================================
// MOCK DO SUPABASE
// =============================================================================

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {},
        },
      },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
  createClient: vi.fn(() => mockSupabaseClient),
}))

// =============================================================================
// MOCK DO LOGGER
// =============================================================================

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(() => vi.fn()),
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    time: vi.fn(() => vi.fn()),
  },
}))

// =============================================================================
// MOCK DO REACT ROUTER
// =============================================================================

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// =============================================================================
// UTILITÁRIOS DE TESTE
// =============================================================================

/**
 * Mock de dados de email para testes
 */
export const mockTrackedEmail = {
  id: 'email-1',
  tracking_id: 'track-123',
  recipient_email: 'recipient@example.com',
  subject: 'Test Email Subject',
  sender_email: 'sender@example.com',
  created_at: '2024-12-19T10:00:00Z',
  metadata: {},
  delivery_status: 'delivered' as const,
  bounce_type: null,
  bounce_reason: null,
  bounce_detected_at: null,
  opens: 5,
  clicks: 2,
  self_opens: 1,
  unique_opens: 3,
  first_opened_at: '2024-12-19T11:00:00Z',
  last_opened_at: '2024-12-19T15:00:00Z',
}

/**
 * Mock de lista de emails
 */
export const mockEmailList = [
  mockTrackedEmail,
  {
    ...mockTrackedEmail,
    id: 'email-2',
    tracking_id: 'track-456',
    subject: 'Another Email',
    opens: 0,
    clicks: 0,
  },
  {
    ...mockTrackedEmail,
    id: 'email-3',
    tracking_id: 'track-789',
    subject: 'Bounced Email',
    delivery_status: 'bounced' as const,
    bounce_type: 'hard',
    bounce_reason: 'Mailbox not found',
  },
]

/**
 * Wrapper para testes com providers
 */
export { mockSupabaseClient }

// =============================================================================
// CONFIGURAÇÕES DE AMBIENTE
// =============================================================================

// Mock de variáveis de ambiente
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('DEV', true)

// Console warnings silenciados em testes
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Ignorar warnings específicos
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render') ||
        args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})
