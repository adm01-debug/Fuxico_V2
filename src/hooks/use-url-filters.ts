import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Sincroniza um objeto de filtros com os `search params` da URL.
 * Facilita compartilhamento de links e histórico persistente entre navegações.
 *
 * Valores `undefined`, `null`, `""` ou iguais ao default são removidos da URL.
 */
export function useUrlFilters<T extends Record<string, string | number | boolean | undefined>>(
  defaults: T,
): [T, (patch: Partial<T>) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const out: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key);
      if (raw === null) continue;
      const def = defaults[key];
      if (typeof def === "number") {
        const n = Number(raw);
        out[key] = Number.isFinite(n) ? n : def;
      } else if (typeof def === "boolean") {
        out[key] = raw === "true";
      } else {
        out[key] = raw;
      }
    }
    return out as T;
  }, [searchParams, defaults]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const def = defaults[key as keyof T];
            const isEmpty =
              value === undefined ||
              value === null ||
              value === "" ||
              (typeof def !== "undefined" && value === def);
            if (isEmpty) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return [filters, update, reset];
}

export default useUrlFilters;
