import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { useGlobalDataSearch } from '@/hooks/use-fulltext-search';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const ROWS: Record<string, Record<string, unknown>[]> = {
  tracked_emails: [
    {
      id: 'e1',
      subject: 'Proposta Comercial',
      recipient_email: 'cliente@exemplo.com',
      sender_email: 'eu@exemplo.com',
    },
  ],
  tracked_documents: [
    {
      id: 'd1',
      file_name: 'contrato.pdf',
      recipient_email: 'cli@exemplo.com',
      description: 'Proposta anexa',
    },
  ],
  tracked_links: [],
  email_templates: [{ id: 't1', name: 'Boas-vindas', subject: 'Oi', category: 'onboarding' }],
  campaigns: [{ id: 'c1', name: 'Black Friday', description: '', status: 'draft' }],
};

function mockSearchChain(rows: Record<string, Record<string, unknown>[]> = ROWS) {
  const select = vi.fn();
  const or = vi.fn();
  const limit = vi.fn();

  mockFrom.mockImplementation((table: string) => ({
    select: (...args: unknown[]) => {
      select(table, ...args);
      return {
        or: (filter: string) => {
          or(table, filter);
          return {
            limit: (count: number) => {
              limit(table, count);
              return Promise.resolve({ data: rows[table] ?? [], error: null });
            },
          };
        },
      };
    },
  }));

  return { select, or, limit };
}

describe('useGlobalDataSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta as 5 tabelas e entrega os hits com label/subLabel', async () => {
    const { or } = mockSearchChain();

    const { result } = renderHook(() => useGlobalDataSearch('Proposta'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.hits).toHaveLength(4));

    const tabelas = mockFrom.mock.calls.map((call) => call[0]).sort();
    expect(tabelas).toEqual([
      'campaigns',
      'email_templates',
      'tracked_documents',
      'tracked_emails',
      'tracked_links',
    ]);

    expect(result.current.hits.map((hit) => hit.table).sort()).toEqual([
      'campaigns',
      'email_templates',
      'tracked_documents',
      'tracked_emails',
    ]);
    expect(result.current.hits.find((hit) => hit.table === 'tracked_emails')?.label).toBe(
      'Proposta Comercial'
    );
    expect(result.current.hits.find((hit) => hit.table === 'tracked_documents')?.sublabel).toBe(
      'cli@exemplo.com'
    );

    // O filtro casado no servidor entra no `match` (usado pelo filtro local do cmdk)
    const docHit = result.current.hits.find((hit) => hit.table === 'tracked_documents');
    expect(docHit?.match).toContain('Proposta anexa');

    expect(or).toHaveBeenCalledWith(
      'tracked_emails',
      'subject.ilike.%Proposta%,recipient_email.ilike.%Proposta%,sender_email.ilike.%Proposta%'
    );
  });

  it('nao consulta o banco com menos de 2 caracteres', async () => {
    mockSearchChain();

    const { result } = renderHook(() => useGlobalDataSearch('a'), {
      wrapper: createWrapper(),
    });

    expect(result.current.hits).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('remove caracteres que quebrariam o filtro or=(col.ilike.%term%)', async () => {
    const { or } = mockSearchChain();

    const { result } = renderHook(() => useGlobalDataSearch('a%,(b'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(or).toHaveBeenCalled());

    expect(or.mock.calls[0][1]).toBe(
      'subject.ilike.%ab%,recipient_email.ilike.%ab%,sender_email.ilike.%ab%'
    );
    expect(result.current.hits).toBeDefined();
  });
});
