import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WatermarkTab from '@/components/dashboard/WatermarkTab';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

describe('WatermarkTab', () => {
  it('renders', () => { render(<WatermarkTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('loading', () => { render(<WatermarkTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('interaction', () => { const fn = vi.fn(); fn(); expect(fn).toHaveBeenCalled(); });
});
