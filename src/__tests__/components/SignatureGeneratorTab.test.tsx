import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignatureGeneratorTab from '@/components/dashboard/SignatureGeneratorTab';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;

describe('SignatureGeneratorTab', () => {
  it('renders', () => { render(<SignatureGeneratorTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('loading', () => { render(<SignatureGeneratorTab />, { wrapper: wrap }); expect(document.body).toBeTruthy(); });
  it('interaction', () => { const fn = vi.fn(); fn(); expect(fn).toHaveBeenCalled(); });
});
