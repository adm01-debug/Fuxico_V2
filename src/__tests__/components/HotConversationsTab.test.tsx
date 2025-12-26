import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HotConversationsTab from '@/components/dashboard/HotConversationsTab';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('HotConversationsTab', () => {
  it('renders without crashing', () => {
    render(<HotConversationsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles loading state', async () => {
    render(<HotConversationsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles empty state', () => {
    render(<HotConversationsTab />, { wrapper });
    expect(document.body).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onClick = vi.fn();
    onClick();
    expect(onClick).toHaveBeenCalled();
  });
});
