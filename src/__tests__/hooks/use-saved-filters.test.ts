import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { toast } from 'sonner';
import { MAX_SAVED_FILTERS, useSavedFilters } from '@/hooks/use-saved-filters';

const fromMock = vi.fn();
let authUser: { id: string } | null = { id: 'user-1' };

vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: authUser, session: null, loading: false }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

interface BuilderResult {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
}

/** Builder encadeável mínimo que imita o PostgREST client (thenable no final da cadeia). */
function makeBuilder(result: BuilderResult) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  for (const method of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'limit']) {
    builder[method] = vi.fn(chain);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return builder as Record<string, ReturnType<typeof vi.fn>>;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const baseFilter = {
  id: 'f1',
  user_id: 'user-1',
  name: 'Cliente VIP',
  entity_type: 'emails',
  filters: { status: 'opened' },
  is_default: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useSavedFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = { id: 'user-1' };
  });

  describe('Carregamento', () => {
    it('carrega os filtros do banco e expõe o padrão', async () => {
      fromMock.mockReturnValue(makeBuilder({ data: [baseFilter], error: null }));

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.filters).toHaveLength(1));

      expect(fromMock).toHaveBeenCalledWith('saved_filters');
      expect(result.current.filters[0].name).toBe('Cliente VIP');
      expect(result.current.defaultFilter?.id).toBe('f1');
      expect(result.current.error).toBeNull();
    });

    it('não consulta o banco quando não há usuário autenticado', () => {
      authUser = null;

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });

      expect(fromMock).not.toHaveBeenCalled();
      expect(result.current.filters).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('expõe mensagem de erro quando a consulta falha', async () => {
      fromMock.mockReturnValue(
        makeBuilder({ data: null, error: { message: 'permission denied for table saved_filters' } })
      );

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });

      await waitFor(() =>
        expect(result.current.error).toBe('permission denied for table saved_filters')
      );
    });
  });

  describe('saveFilter', () => {
    it('insere com o usuário atual, entidade e nome sem espaços', async () => {
      const loadBuilder = makeBuilder({ data: [], error: null });
      const insertBuilder = makeBuilder({ data: baseFilter, error: null });
      fromMock.mockReturnValueOnce(loadBuilder).mockReturnValueOnce(insertBuilder);

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(1));

      let created: unknown;
      await act(async () => {
        created = await result.current.saveFilter({
          name: '  Minha seleção  ',
          filters: { status: 'clicked' },
        });
      });

      expect(insertBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        entity_type: 'emails',
        name: 'Minha seleção',
        filters: { status: 'clicked' },
        is_default: false,
      });
      expect(created).toEqual(baseFilter);
      expect(toast.success).toHaveBeenCalled();
    });

    it('recusa filtro sem nome', async () => {
      fromMock.mockReturnValue(makeBuilder({ data: [], error: null }));

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });

      let created: unknown = 'pendente';
      await act(async () => {
        created = await result.current.saveFilter({ name: '   ', filters: {} });
      });

      expect(created).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Informe um nome para o filtro');
      expect(fromMock).toHaveBeenCalledTimes(1);
    });

    it(`recusa acima do limite de ${MAX_SAVED_FILTERS} filtros`, async () => {
      const many = Array.from({ length: MAX_SAVED_FILTERS }, (_, index) => ({
        ...baseFilter,
        id: `f${index}`,
        name: `Filtro ${index}`,
      }));
      fromMock.mockReturnValue(makeBuilder({ data: many, error: null }));

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.filters).toHaveLength(MAX_SAVED_FILTERS));

      let created: unknown = 'pendente';
      await act(async () => {
        created = await result.current.saveFilter({ name: 'Excedente', filters: {} });
      });

      expect(created).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        `Limite de ${MAX_SAVED_FILTERS} filtros salvos atingido`
      );
    });

    it('traduz nome duplicado para mensagem amigável', async () => {
      const loadBuilder = makeBuilder({ data: [], error: null });
      const insertBuilder = makeBuilder({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
      fromMock.mockReturnValueOnce(loadBuilder).mockReturnValueOnce(insertBuilder);

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(fromMock).toHaveBeenCalledTimes(1));

      let created: unknown = 'pendente';
      await act(async () => {
        created = await result.current.saveFilter({ name: 'Duplicado', filters: {} });
      });

      expect(created).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Já existe um filtro com esse nome');
    });
  });

  describe('deleteFilter e setDefault', () => {
    it('remove o filtro pelo id', async () => {
      const loadBuilder = makeBuilder({ data: [baseFilter], error: null });
      const deleteBuilder = makeBuilder({ data: null, error: null });
      fromMock.mockReturnValueOnce(loadBuilder).mockReturnValueOnce(deleteBuilder);

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.filters).toHaveLength(1));

      let deleted = false;
      await act(async () => {
        deleted = await result.current.deleteFilter('f1');
      });

      expect(deleted).toBe(true);
      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'f1');
      expect(toast.success).toHaveBeenCalledWith('Filtro removido');
    });

    it('marca o filtro como padrão via update', async () => {
      const loadBuilder = makeBuilder({ data: [baseFilter], error: null });
      const updateBuilder = makeBuilder({ data: { ...baseFilter, is_default: true }, error: null });
      fromMock.mockReturnValueOnce(loadBuilder).mockReturnValueOnce(updateBuilder);

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.filters).toHaveLength(1));

      await act(async () => {
        await result.current.setDefault('f1');
      });

      expect(updateBuilder.update).toHaveBeenCalledWith({ is_default: true });
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'f1');
      expect(toast.success).toHaveBeenCalledWith('Filtro padrão definido');
    });

    it('recusa atualização com nome vazio', async () => {
      fromMock.mockReturnValue(makeBuilder({ data: [baseFilter], error: null }));

      const { result } = renderHook(() => useSavedFilters('emails'), {
        wrapper: createWrapper(),
      });

      let updated: unknown = 'pendente';
      await act(async () => {
        updated = await result.current.updateFilter({ id: 'f1', name: '  ' });
      });

      expect(updated).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Informe um nome para o filtro');
    });
  });
});
