import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUrlFilters } from '@/hooks/use-url-filters';

type S = { q: string; page: number; active: boolean };

const defaults: S = { q: '', page: 1, active: false };

function renderFilters(initialEntry = '/analytics') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => {
      const location = useLocation();
      const [filters, update, reset] = useUrlFilters<S>(defaults);
      return { filters, update, reset, search: location.search };
    },
    { wrapper }
  );
}

describe('useUrlFilters', () => {
  it('devolve os defaults quando a URL não tem filtros', () => {
    const { result } = renderFilters();
    expect(result.current.filters).toEqual({ q: '', page: 1, active: false });
    expect(result.current.search).toBe('');
  });

  it('lê os filtros da URL respeitando o tipo do default', () => {
    const { result } = renderFilters('/analytics?q=ana&page=3&active=true');
    expect(result.current.filters).toEqual({ q: 'ana', page: 3, active: true });
  });

  it('grava o filtro na URL', () => {
    const { result } = renderFilters();
    act(() => result.current.update({ q: 'ana' }));
    expect(result.current.search).toBe('?q=ana');
    expect(result.current.filters.q).toBe('ana');
  });

  it('remove da URL o valor igual ao default', () => {
    const { result } = renderFilters('/analytics?q=ana&page=3');
    act(() => result.current.update({ q: '', page: 1 }));
    expect(result.current.search).toBe('');
    expect(result.current.filters).toEqual({ q: '', page: 1, active: false });
  });

  it('reset limpa todos os filtros da URL', () => {
    const { result } = renderFilters('/analytics?q=ana&page=3&active=true');
    act(() => result.current.reset());
    expect(result.current.search).toBe('');
    expect(result.current.filters).toEqual({ q: '', page: 1, active: false });
  });
});
