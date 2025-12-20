// =============================================================================
// FUXICO - Setup de Testes
// Arquivo: src/__tests__/setup.ts
// Descrição: Configuração global para testes unitários
// =============================================================================

import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// =============================================================================
// MOCK DO SUPABASE CLIENT
// =============================================================================

const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
}

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser,
}

// Mock data factories
export const createMockEmail = (overrides = {}) => ({
  id: 'email-id-1',
  tracking_id: 'tracking-123',
  recipient_email: 'recipient@example.com',
  sender_email: 'sender@example.com',
  subject: 'Test Subject',
  created_at: new Date().toISOString(),
  delivery_status: 'sent',
  bounce_type: null,
  bounce_reason: null,
  bounce_detected_at: null,
  user_id: mockUser.id,
  metadata: {},
  ...overrides,
})

export const createMockEvent = (overrides = {}) => ({
  id: 'event-id-1',
  tracking_id: 'tracking-123',
  event_type: 'open',
  created_at: new Date().toISOString(),
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0',
  is_self_open: false,
  referer: null,
  link_url: null,
  metadata: {},
  ...overrides,
})

export const createMockLink = (overrides = {}) => ({
  id: 'link-id-1',
  tracking_id: 'tracking-123',
  link_id: 'link-abc',
  original_url: 'https://example.com',
  click_count: 0,
  created_at: new Date().toISOString(),
  ...overrides,
})

// Supabase query builder mock
const createQueryBuilder = (data: unknown[] = [], error: Error | null = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    then: vi.fn((resolve) => resolve({ data, error })),
  }
  
  // Make it thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: { data: unknown[]; error: Error | null }) => void) => {
      resolve({ data, error })
    },
  })
  
  return builder
}

// RPC mock responses
const rpcResponses: Record<string, unknown> = {
  get_emails_with_stats: [],
  get_user_tracking_stats: [{
    total_emails: 10,
    total_opens: 50,
    total_clicks: 20,
    total_bounces: 2,
    open_rate: 80,
    click_rate: 40,
    bounce_rate: 20,
  }],
  refresh_email_stats_mv: null,
}

// Create the mock Supabase client
export const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn((table: string) => {
    // Return appropriate mock data based on table
    switch (table) {
      case 'tracked_emails':
        return createQueryBuilder([createMockEmail()])
      case 'tracking_events':
        return createQueryBuilder([createMockEvent()])
      case 'tracked_links':
        return createQueryBuilder([createMockLink()])
      default:
        return createQueryBuilder([])
    }
  }),
  rpc: vi.fn((functionName: string) => {
    const data = rpcResponses[functionName] || null
    return Promise.resolve({ data, error: null })
  }),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  })),
  removeChannel: vi.fn(),
}

// Mock the Supabase client module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

// =============================================================================
// MOCK DO REACT-QUERY
// =============================================================================

export const createMockQueryClient = () => ({
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  prefetchQuery: vi.fn(),
  clear: vi.fn(),
})

// =============================================================================
// MOCK DO REACT-ROUTER
// =============================================================================

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
  }
})

// =============================================================================
// MOCK DO SONNER (TOAST)
// =============================================================================

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// =============================================================================
// MOCK DE MATCHMEDIA
// =============================================================================

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

// =============================================================================
// MOCK DE RESIZE OBSERVER
// =============================================================================

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})

// =============================================================================
// MOCK DE INTERSECTION OBSERVER
// =============================================================================

class MockIntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// =============================================================================
// SETUP E TEARDOWN
// =============================================================================

beforeAll(() => {
  // Suprimir console.error e console.warn durante testes
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})

// =============================================================================
// HELPERS PARA TESTES
// =============================================================================

export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

export const mockAuthenticatedUser = () => {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
}

export const mockUnauthenticatedUser = () => {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
}

export const mockSupabaseError = (error: Error) => {
  mockSupabase.from.mockReturnValue(createQueryBuilder([], error))
}

export { mockUser, mockSession }
