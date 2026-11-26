import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { detectSlackPlatform } from '@/hooks/use-webhook';
import SlackTeamsTab from '@/components/dashboard/SlackTeamsTab';

const sendMock = vi.fn();
const saveMock = vi.fn();
const toastMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));
vi.mock('@/hooks/use-toast', () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

vi.mock('@/hooks/use-webhook', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-webhook')>();
  return {
    ...actual,
    useWebhookConfig: () => ({ data: null, isLoading: false }),
    useSaveWebhookConfig: () => ({ mutateAsync: saveMock, isPending: false }),
    useSendSlackNotification: () => ({ mutateAsync: sendMock, isPending: false }),
  };
});

const SLACK_URL = 'https://hooks.slack.com/services/T1/B2/xyz';
const TEAMS_URL = 'https://fuxico.webhook.office.com/webhookb2/abc';

function typeUrl(value: string) {
  fireEvent.change(screen.getByLabelText('URL do Incoming Webhook'), { target: { value } });
}

describe('detectSlackPlatform', () => {
  it('reconhece Slack e Teams pelo host do webhook', () => {
    expect(detectSlackPlatform(SLACK_URL)).toBe('slack');
    expect(detectSlackPlatform(TEAMS_URL)).toBe('teams');
  });

  it('devolve null para host desconhecido ou URL invalida', () => {
    expect(detectSlackPlatform('https://meu-sistema.com/api/webhook')).toBeNull();
    expect(detectSlackPlatform('nao-e-url')).toBeNull();
  });
});

describe('SlackTeamsTab', () => {
  beforeEach(() => {
    sendMock.mockReset();
    saveMock.mockReset();
    toastMock.mockReset();
  });

  it('envia o teste pela edge usando a plataforma detectada na URL', async () => {
    sendMock.mockResolvedValue({ success: true });

    render(<SlackTeamsTab />);

    typeUrl(SLACK_URL);
    fireEvent.click(screen.getByRole('button', { name: /enviar teste/i }));

    await waitFor(() => expect(sendMock).toHaveBeenCalledTimes(1));
    expect(sendMock.mock.calls[0][0]).toMatchObject({
      platform: 'slack',
      eventType: 'open',
      recipientEmail: 'cliente@exemplo.com',
      webhookUrl: SLACK_URL,
    });
    expect(await screen.findByText(/notificacao de teste enviada/i)).toBeTruthy();
  });

  it('nao envia nem salva quando a URL nao e de Slack/Teams', async () => {
    render(<SlackTeamsTab />);

    typeUrl('https://meu-sistema.com/api/webhook');
    expect(screen.getByRole('button', { name: /enviar teste/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /salvar integracao/i }));

    expect(sendMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'URL nao reconhecida', variant: 'destructive' })
    );
  });

  it('mostra o erro devolvido pela edge quando o envio falha', async () => {
    sendMock.mockRejectedValue(
      new Error('Webhook URL is not allowed (private/internal addresses blocked)')
    );

    render(<SlackTeamsTab />);

    typeUrl(TEAMS_URL);
    fireEvent.click(screen.getByRole('button', { name: /enviar teste/i }));

    expect(await screen.findByText(/private\/internal addresses blocked/i)).toBeTruthy();
    expect(screen.getByText('Falhou')).toBeTruthy();
  });

  it('salva a integracao quando a URL e valida', async () => {
    saveMock.mockResolvedValue({ id: 'cfg-1' });

    render(<SlackTeamsTab />);

    typeUrl(TEAMS_URL);
    fireEvent.click(screen.getByRole('button', { name: /salvar integracao/i }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock.mock.calls[0][0]).toMatchObject({ url: TEAMS_URL, is_active: true });
  });
});
