import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualListOptions<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
}

export function useVirtualList<T>({ items, estimateSize = 48, overscan = 5 }: UseVirtualListOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const getVirtualItems = useCallback(() => {
    return virtualizer.getVirtualItems().map(virtualRow => ({
      ...virtualRow,
      item: items[virtualRow.index],
    }));
  }, [virtualizer, items]);

  return {
    parentRef,
    virtualizer,
    getVirtualItems,
    totalSize: virtualizer.getTotalSize(),
  };
}
