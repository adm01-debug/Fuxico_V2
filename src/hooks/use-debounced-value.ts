import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * 
 * @description Retorna um valor com debounce, útil para inputs de busca
 * onde você não quer disparar requisições a cada tecla digitada.
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 300);
 * 
 * useEffect(() => {
 *   // Só busca quando o usuário para de digitar por 300ms
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 * 
 * @param value - Valor a ser debounced
 * @param delay - Tempo de espera em milissegundos (default: 300)
 * @returns Valor com debounce aplicado
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para callback com debounce
 * 
 * @description Retorna uma função com debounce, útil para handlers
 * que precisam ser limitados em frequência.
 * 
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   fetchResults(term);
 * }, 300);
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 * 
 * @param callback - Função a ser chamada após o debounce
 * @param delay - Tempo de espera em milissegundos
 * @returns Função com debounce
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    const id = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setTimeoutId(id);
  };
}
