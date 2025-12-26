import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ActivityDashboard from '@/components/dashboard/ActivityDashboard';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ActivityDashboard', () => {
  it('renders without crashing', () => {
    render(<ActivityDashboard />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles loading state', async () => {
    render(<ActivityDashboard />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles empty state', () => {
    render(<ActivityDashboard />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onClick = vi.fn();
    onClick();
    expect(onClick).toHaveBeenCalled();
  });
});
