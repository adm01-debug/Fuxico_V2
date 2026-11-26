import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';
import { TrackingDetailSheet } from '@/components/dashboard/TrackingDetailSheet';
import type { EmailDetailResponse } from '@/features/tracking/lib/tracking-api';

const useEmailDetailMock = vi.fn();

vi.mock('@/features/tracking/hooks/use-tracking', () => ({
  useEmailDetail: (trackingId: string) => useEmailDetailMock(trackingId),
}));

function detail(overrides: Partial<EmailDetailResponse> = {}): EmailDetailResponse {
  return {
    email: {
      trackingId: 'trk-1',
      recipientEmail: 'cliente@exemplo.com',
      subject: 'Proposta Comercial Q4',
      createdAt: '2026-11-25T10:00:00.000Z',
      deliveryStatus: 'delivered',
    },
    summary: { opens: 1, selfOpens: 1, firstOpenAt: null, lastOpenAt: null, clicks: 0 },
    links: [],
    timeline: [],
    ...overrides,
  };
}

function stub(result: Record<string, unknown>) {
  (useEmailDetailMock as Mock).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...result,
  });
}

describe('TrackingDetailSheet', () => {
  beforeEach(() => {
    useEmailDetailMock.mockReset();
  });

  it('conta cliques pela timeline quando o resumo vem zerado', () => {
    stub({
      data: detail({
        timeline: [
          {
            type: 'click',
            at: '2026-11-25T12:00:00.000Z',
            device: 'Desktop',
            client: 'Chrome',
            isSelfOpen: false,
            linkUrl: 'https://exemplo.com/oferta',
            country: 'BR',
            city: 'Sao Paulo',
          },
          {
            type: 'click',
            at: '2026-11-25T13:00:00.000Z',
            device: 'Celular',
            client: 'Gmail',
            isSelfOpen: false,
            linkUrl: 'https://exemplo.com/oferta',
            country: null,
            city: null,
          },
        ],
      }),
    });

    render(<TrackingDetailSheet trackingId="trk-1" open onOpenChange={vi.fn()} />);

    expect(screen.getByText('Cliques').nextElementSibling?.textContent).toBe('2');
    expect(screen.getByText('Aberturas').nextElementSibling?.textContent).toBe('1');
  });

  it('avisa quando nao ha interacoes e lista os links mais clicados', () => {
    stub({
      data: detail({
        links: [{ linkId: 'l-1', url: 'https://exemplo.com/oferta', clicks: 3 }],
      }),
    });

    render(<TrackingDetailSheet trackingId="trk-1" open onOpenChange={vi.fn()} />);

    expect(screen.getByText('Nenhuma abertura ou clique registrado ainda.')).toBeInTheDocument();
    expect(screen.getByText('https://exemplo.com/oferta')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('mostra erro com opcao de tentar novamente', () => {
    stub({ isError: true });

    render(<TrackingDetailSheet trackingId="trk-1" open onOpenChange={vi.fn()} />);

    expect(
      screen.getByText('Não foi possível carregar o detalhe deste e-mail.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('nao consulta o detalhe quando fechado', () => {
    stub({ data: undefined });

    render(<TrackingDetailSheet trackingId="trk-1" open={false} onOpenChange={vi.fn()} />);

    expect(useEmailDetailMock).toHaveBeenCalledWith('');
  });
});
