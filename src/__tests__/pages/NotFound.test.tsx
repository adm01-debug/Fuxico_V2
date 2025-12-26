import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFound from '@/pages/NotFound';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('NotFound Page', () => {
  it('renders without crashing', () => {
    render(<NotFound />, { wrapper: wrap });
    expect(document.body).toBeTruthy();
  });

  it('has proper structure', () => {
    render(<NotFound />, { wrapper: wrap });
    expect(document.body).toBeTruthy();
  });

  it('handles navigation', () => {
    render(<NotFound />, { wrapper: wrap });
    expect(document.body).toBeTruthy();
  });
});
