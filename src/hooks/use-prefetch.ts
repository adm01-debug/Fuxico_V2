/**
 * Hook para prefetch de rotas
 * @description Melhora navegação carregando rotas antecipadamente
 */
import { useCallback } from 'react';

const routeModules: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/settings': () => import('@/pages/Settings'),
  '/security': () => import('@/pages/Security'),
};

export function usePrefetch() {
  const prefetch = useCallback((route: string) => {
    const loader = routeModules[route];
    if (loader) {
      loader();
    }
  }, []);

  const prefetchAll = useCallback(() => {
    Object.values(routeModules).forEach(loader => loader());
  }, []);

  return { prefetch, prefetchAll };
}

export default usePrefetch;
