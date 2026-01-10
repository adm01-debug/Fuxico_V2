/**
 * Performance utilities for React components
 * 
 * @description
 * Collection of utilities for optimizing React component performance
 * including memoization helpers and comparison functions.
 */

import { memo, ComponentType, FC } from 'react';

/**
 * Deep comparison function for memo
 */
export function deepEqual<T>(prev: T, next: T): boolean {
  if (prev === next) return true;
  if (typeof prev !== typeof next) return false;
  if (typeof prev !== 'object' || prev === null) return false;
  
  const prevKeys = Object.keys(prev as object);
  const nextKeys = Object.keys(next as object);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => 
    deepEqual((prev as Record<string, unknown>)[key], (next as Record<string, unknown>)[key])
  );
}

/**
 * Shallow comparison for arrays
 */
export function shallowArrayEqual<T>(prev: T[], next: T[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((item, index) => item === next[index]);
}

/**
 * Creates a memoized component with custom comparison
 */
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prev: P, next: P) => boolean
): FC<P> {
  return memo(Component, areEqual) as FC<P>;
}

/**
 * Creates a memoized component with deep comparison
 */
export function withDeepMemo<P extends object>(
  Component: ComponentType<P>
): FC<P> {
  return memo(Component, deepEqual) as FC<P>;
}

export default { deepEqual, shallowArrayEqual, withMemo, withDeepMemo };
