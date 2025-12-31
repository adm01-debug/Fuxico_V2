// FUXICO - Hook: useInfiniteScroll
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseInfiniteScrollOptions {
  table: string;
  columns?: string;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export function useInfiniteScroll<T>({
  table,
  columns = '*',
  pageSize = 20,
  orderBy = 'created_at',
  orderDirection = 'desc',
  filters = {},
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['infinite', table, filters, orderBy],
    queryFn: async ({ pageParam = 0 }) => {
      let queryBuilder = supabase
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as T[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreRef.current) {
      observerRef.current?.unobserve(loadMoreRef.current);
    }

    loadMoreRef.current = node;

    if (node && query.hasNextPage && !query.isFetchingNextPage) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            query.fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const allData = query.data?.pages.flat() ?? [];

  return {
    data: allData,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error,
    refetch: query.refetch,
    loadMoreRef: setLoadMoreRef,
    totalLoaded: allData.length,
  };
}

export default useInfiniteScroll;
