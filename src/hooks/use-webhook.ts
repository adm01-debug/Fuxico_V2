// =============================================================================
// FUXICO - Webhook Configuration Hook
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  event_type: string;
  success: boolean;
  response_status?: number;
  error?: string;
  created_at: string;
}

export function useWebhookConfig() {
  return useQuery<WebhookConfig | null>({
    queryKey: ['webhook-config'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      return data as WebhookConfig | null;
    },
  });
}

export function useWebhookLogs(limit = 20) {
  return useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs', limit],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('webhook_logs')
        .select('id, event_type, success, response_status, error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      return (data || []) as WebhookLog[];
    },
  });
}

export function useSaveWebhookConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      url: string;
      secret?: string;
      events: string[];
      is_active: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('webhook_configs')
        .upsert(
          {
            user_id: user.id,
            ...config,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-config'] });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (url: string) => {
      // SECURITY: Validate URL format before sending test request
      try {
        const parsed = new URL(url);
        if (!['https:', 'http:'].includes(parsed.protocol)) {
          throw new Error('Only HTTP/HTTPS URLs are allowed');
        }
        // Block localhost and private IPs from browser
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
        if (blockedHosts.includes(parsed.hostname)) {
          throw new Error('Localhost URLs are not allowed');
        }
      } catch (e) {
        if (e instanceof TypeError) throw new Error('Invalid URL format', { cause: e });
        throw e;
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'test',
            message: 'Test webhook from FUXICO',
            timestamp: new Date().toISOString(),
          }),
        });
        return { success: response.ok, status: response.status };
      } catch {
        return { success: false, status: 0 };
      }
    },
  });
}

// =============================================================================
// SLACK / MICROSOFT TEAMS
// =============================================================================

export type SlackPlatform = 'slack' | 'teams';

export const SLACK_EVENTS = [
  { id: 'open', label: 'Abertura de e-mail' },
  { id: 'click', label: 'Clique em link' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'reply', label: 'Resposta recebida' },
  { id: 'document_view', label: 'Visualização de documento' },
] as const;

export type SlackEventType = (typeof SLACK_EVENTS)[number]['id'];

const TEAMS_HOST_SUFFIXES = ['.webhook.office.com', '.office.com', '.logic.azure.com'];

/** Identifica a plataforma pelo host do Incoming Webhook (null = URL desconhecida/invalida). */
export function detectSlackPlatform(url: string): SlackPlatform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'hooks.slack.com') return 'slack';
    if (TEAMS_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return 'teams';
    return null;
  } catch {
    return null;
  }
}

export interface SlackNotificationInput {
  webhookUrl: string;
  platform: SlackPlatform;
  eventType: SlackEventType;
  recipientEmail: string;
  subject?: string;
  trackingId?: string;
  linkUrl?: string;
  documentName?: string;
}

/**
 * Envia a notificação pela edge `send-slack-notification`: o payload no formato Block Kit (Slack)
 * ou Adaptive Card (Teams) é montado no servidor, o que também evita o bloqueio de CORS que
 * ocorre ao chamar o webhook direto do navegador.
 */
export function useSendSlackNotification() {
  return useMutation({
    mutationFn: async (input: SlackNotificationInput) => {
      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        error?: string;
      }>('send-slack-notification', {
        body: {
          webhookUrl: input.webhookUrl,
          platform: input.platform,
          eventType: input.eventType,
          data: {
            recipientEmail: input.recipientEmail,
            subject: input.subject,
            trackingId: input.trackingId,
            linkUrl: input.linkUrl,
            documentName: input.documentName,
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) {
        // O corpo de erro da function traz { error, details }; preserva o motivo real.
        const ctx = (error as { context?: { json?: () => Promise<{ error?: unknown }> } }).context;
        if (ctx?.json) {
          const parsed = await ctx.json().catch(() => null);
          if (parsed?.error) {
            throw new Error(
              typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)
            );
          }
        }
        throw error;
      }

      if (data?.error) throw new Error(String(data.error));

      return data;
    },
  });
}

export interface ReplayFailedWebhooksResult {
  webhook_id: string;
  enqueued: number;
}

/**
 * Reenvia os webhooks falhos das ultimas 24h enfileirando-os em
 * `webhook_retry_queue` (RPC `replay_failed_webhooks`, restrita ao dono do
 * webhook_configs). O worker `webhook-retry-worker` roda a cada 2 minutos e
 * consome a fila.
 */
export function useReplayFailedWebhooks() {
  const queryClient = useQueryClient();

  return useMutation<ReplayFailedWebhooksResult, Error, { webhookId: string; limit?: number }>({
    mutationFn: async ({ webhookId, limit = 50 }) => {
      const { data, error } = await supabase.rpc('replay_failed_webhooks', {
        _webhook_id: webhookId,
        _limit: limit,
      });
      if (error) throw new Error(error.message);
      return data as ReplayFailedWebhooksResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-logs'] });
    },
  });
}
