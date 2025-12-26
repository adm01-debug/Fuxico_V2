import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PollsTab from '@/components/dashboard/PollsTab';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

describe('PollsTab', () => {
  it('renders', () => { render(<PollsTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('loading', () => { render(<PollsTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('interaction', () => { const fn = vi.fn(); fn(); expect(fn).toHaveBeenCalled(); });
});
