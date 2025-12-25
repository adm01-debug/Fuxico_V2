import { useState, useCallback } from 'react';

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for clipboard operations
 * 
 * @description Provides copy to clipboard functionality with status tracking.
 * 
 * @example
 * ```tsx
 * const { copy, copied, error } = useClipboard();
 * 
 * return (
 *   <Button onClick={() => copy(trackingId)}>
 *     {copied ? 'Copied!' : 'Copy ID'}
 *   </Button>
 * );
 * ```
 */
export function useClipboard(timeout: number = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (!navigator?.clipboard) {
        throw new Error('Clipboard API not available');
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError(null);

      setTimeout(() => {
        setCopied(false);
      }, timeout);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Copy failed');
      setError(error);
      setCopied(false);
      return false;
    }
  }, [timeout]);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}

/**
 * Hook to read from clipboard
 */
export function useClipboardRead(): {
  read: () => Promise<string | null>;
  reading: boolean;
  error: Error | null;
} {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const read = useCallback(async (): Promise<string | null> => {
    setReading(true);
    setError(null);

    try {
      if (!navigator?.clipboard) {
        throw new Error('Clipboard API not available');
      }

      const text = await navigator.clipboard.readText();
      setReading(false);
      return text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Read failed');
      setError(error);
      setReading(false);
      return null;
    }
  }, []);

  return { read, reading, error };
}
