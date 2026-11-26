import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMfaBackupCodes } from '@/hooks/use-mfa-backup-codes';

let mockUser: { id: string } | null = { id: 'user-123' };
let selectResult: { data: unknown; error: unknown } = { data: [], error: null };
const mockRpc = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser, session: {}, loading: false }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        is: () => builder,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(selectResult).then(resolve),
      };
      return builder;
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMfaBackupCodes', () => {
  beforeEach(() => {
    mockUser = { id: 'user-123' };
    selectResult = { data: [], error: null };
    mockRpc.mockReset();
  });

  it('conta apenas os códigos ainda não usados', async () => {
    selectResult = { data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null };

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.remaining).toBe(3));
  });

  it('começa com zero códigos quando a consulta falha (sem quebrar a UI)', async () => {
    selectResult = { data: null, error: { message: 'boom' } };

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoadingRemaining).toBe(false));
    expect(result.current.remaining).toBe(0);
  });

  it('gera códigos pela RPC segura do banco', async () => {
    mockRpc.mockResolvedValue({ data: ['AAAAA-BBBBB', 'CCCCC-DDDDD'], error: null });

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    let codes: string[] = [];
    await act(async () => {
      codes = await result.current.generate.mutateAsync();
    });

    expect(mockRpc).toHaveBeenCalledWith('generate_mfa_backup_codes');
    expect(codes).toEqual(['AAAAA-BBBBB', 'CCCCC-DDDDD']);
  });

  it('normaliza o código antes de consumir (trim + maiúsculas)', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    let valid = false;
    await act(async () => {
      valid = await result.current.consume.mutateAsync('  aaaaa-bbbbb  ');
    });

    expect(mockRpc).toHaveBeenCalledWith('consume_mfa_backup_code', {
      _user_id: 'user-123',
      _code: 'AAAAA-BBBBB',
    });
    expect(valid).toBe(true);
  });

  it('trata código inválido como não consumido', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    let valid = true;
    await act(async () => {
      valid = await result.current.consume.mutateAsync('AAAAA-BBBBB');
    });

    expect(valid).toBe(false);
  });

  it('propaga erro da RPC de geração', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'forbidden' } });

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.generate.mutateAsync()).rejects.toThrow('forbidden');
    });
  });

  it('recusa operações sem usuário autenticado', async () => {
    mockUser = null;

    const { result } = renderHook(() => useMfaBackupCodes(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(result.current.generate.mutateAsync()).rejects.toThrow(
        'Usuário não autenticado'
      );
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
