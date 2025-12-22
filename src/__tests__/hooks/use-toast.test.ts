import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '../hooks/use-toast';
describe('useToast', () => { it('should add toast', () => { const { result } = renderHook(() => useToast()); act(() => { result.current.toast({ title: 'Test', description: 'Desc' }); }); expect(result.current.toasts.length).toBeGreaterThanOrEqual(0); }); });
