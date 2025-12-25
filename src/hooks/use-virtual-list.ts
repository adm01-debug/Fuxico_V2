import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Configuration for virtual list
 */
interface VirtualListConfig {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render outside visible area */
  overscan?: number;
}

/**
 * Return type for useVirtualList hook
 */
interface VirtualListReturn {
  /** Items to render (with index and style) */
  virtualItems: Array<{ index: number; style: React.CSSProperties }>;
  /** Total height of all items */
  totalHeight: number;
  /** Scroll handler to attach to container */
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Ref to attach to scroll container */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for virtual list rendering
 * 
 * @description Renders only visible items in a long list for performance.
 * Useful for email lists, audit logs, and other large datasets.
 * 
 * @example
 * ```tsx
 * const { virtualItems, totalHeight, onScroll, containerRef } = useVirtualList({
 *   itemCount: emails.length,
 *   itemHeight: 60,
 *   containerHeight: 600,
 *   overscan: 5
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: 600, overflow: 'auto' }} onScroll={onScroll}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, style }) => (
 *         <div key={index} style={style}>
 *           <EmailRow email={emails[index]} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 * 
 * @param config - Virtual list configuration
 * @returns Virtual list state and handlers
 */
export function useVirtualList({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3
}: VirtualListConfig): VirtualListReturn {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = itemCount * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount);

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      style: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: itemHeight,
        transform: `translateY(${i * itemHeight}px)`
      }
    });
  }

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    virtualItems,
    totalHeight,
    onScroll,
    containerRef
  };
}
