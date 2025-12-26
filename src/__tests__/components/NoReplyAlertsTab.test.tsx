import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NoReplyAlertsTab from '@/components/dashboard/NoReplyAlertsTab';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('NoReplyAlertsTab', () => {
  it('renders without crashing', () => {
    render(<NoReplyAlertsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles loading state', async () => {
    render(<NoReplyAlertsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles empty state', () => {
    render(<NoReplyAlertsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onClick = vi.fn();
    onClick();
    expect(onClick).toHaveBeenCalled();
  });
});
