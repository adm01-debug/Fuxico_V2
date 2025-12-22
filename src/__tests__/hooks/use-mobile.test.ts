import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../hooks/use-mobile';
describe('useIsMobile', () => { it('should return boolean', () => { const { result } = renderHook(() => useIsMobile()); expect(typeof result.current).toBe('boolean'); }); });
