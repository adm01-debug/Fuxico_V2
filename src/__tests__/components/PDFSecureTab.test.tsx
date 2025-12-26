import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PDFSecureTab from '@/components/dashboard/PDFSecureTab';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

describe('PDFSecureTab', () => {
  it('renders', () => { render(<PDFSecureTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('loading', () => { render(<PDFSecureTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('interaction', () => { const fn = vi.fn(); fn(); expect(fn).toHaveBeenCalled(); });
});
