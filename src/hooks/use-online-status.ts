import { useState, useEffect } from 'react';

/**
 * Hook for tracking online/offline status
 * 
 * @description Monitors network connectivity and returns current status.
 * 
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook with more detailed network information
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
} {
  const isOnline = useOnlineStatus();
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: null as string | null,
    downlink: null as number | null,
    rtt: null as number | null,
    saveData: false
  });

  useEffect(() => {
    const connection = (navigator as unknown as { connection?: NetworkInformation })?.connection;
    
    if (!connection) return;

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false
      });
    };

    updateNetworkInfo();
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return { isOnline, ...networkInfo };
}

// Network Information API types (not yet in lib.dom.d.ts)
interface NetworkInformation extends EventTarget {
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
}
