// =============================================================================
// FUXICO - Integracao Slack / Microsoft Teams
// =============================================================================

import { useState } from 'react';
import {
  useWebhookConfig,
  useSaveWebhookConfig,
  useSendSlackNotification,
  detectSlackPlatform,
  SLACK_EVENTS,
  type SlackEventType,
} from '@/hooks/use-webhook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { log } from '@/lib/logger';
import { Loader2, Plug, Send, CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_EVENTS = ['email_open', 'link_click', 'bounce'];

const PLATFORM_LABELS = { slack: 'Slack', teams: 'Microsoft Teams' } as const;

export default function SlackTeamsTab() {
  const { data: config, isLoading } = useWebhookConfig();
  const saveConfig = useSaveWebhookConfig();
  const sendNotification = useSendSlackNotification();

  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const [eventType, setEventType] = useState<SlackEventType>('open');
  const [recipientEmail, setRecipientEmail] = useState('cliente@exemplo.com');
  const [subject, setSubject] = useState('Proposta Comercial');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const url = urlDraft ?? config?.url ?? '';
  const platform = detectSlackPlatform(url);

  const handleSave = async () => {
    if (!url.trim()) {
      toast({
        title: 'URL obrigatoria',
        description: 'Cole a URL do Incoming Webhook do Slack ou do Teams.',
        variant: 'destructive',
      });
      return;
    }

    if (!platform) {
      toast({
        title: 'URL nao reconhecida',
        description:
          'Use a URL do Slack (https://hooks.slack.com/...) ou do Teams (https://*.webhook.office.com/...).',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveConfig.mutateAsync({
        url: url.trim(),
        secret: config?.secret || undefined,
        events: config?.events?.length ? config.events : DEFAULT_EVENTS,
        is_active: true,
      });
      toast({
        title: 'Integracao salva',
        description: `Webhook do ${PLATFORM_LABELS[platform]} conectado aos eventos de rastreamento.`,
      });
    } catch (error) {
      log.error('SlackTeamsTab: falha ao salvar integracao', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Nao foi possivel salvar a integracao.',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async () => {
    if (!platform) {
      toast({
        title: 'URL obrigatoria',
        description: 'Informe uma URL valida do Slack ou do Teams antes de testar.',
        variant: 'destructive',
      });
      return;
    }

    setResult(null);

    try {
      await sendNotification.mutateAsync({
        webhookUrl: url.trim(),
        platform,
        eventType,
        recipientEmail: recipientEmail.trim(),
        subject: subject.trim() || undefined,
      });
      setResult({
        ok: true,
        message: `Notificacao de teste enviada para o ${PLATFORM_LABELS[platform]}. Confira o canal.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar a notificacao';
      log.error('SlackTeamsTab: falha no envio de teste', error);
      setResult({ ok: false, message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle>Conectar Slack ou Microsoft Teams</CardTitle>
          </div>
          <CardDescription>
            Receba avisos de abertura, clique e bounce direto no canal da sua equipe. Cole a URL do
            Incoming Webhook abaixo — o formato da mensagem e montado no servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="slack-webhook-url">URL do Incoming Webhook</Label>
              {platform ? (
                <Badge variant="secondary">{PLATFORM_LABELS[platform]} detectado</Badge>
              ) : null}
            </div>
            <Input
              id="slack-webhook-url"
              type="url"
              inputMode="url"
              placeholder="https://hooks.slack.com/services/..."
              value={url}
              onChange={(event) => setUrlDraft(event.target.value)}
              aria-describedby="slack-webhook-help"
            />
            <p id="slack-webhook-help" className="text-xs text-muted-foreground">
              Slack: Aplicativos &gt; Incoming Webhooks &gt; Adicionar ao canal. Teams: canal &gt;
              Conectores &gt; Incoming Webhook.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saveConfig.isPending}>
              {saveConfig.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Salvar integracao
            </Button>
            {config?.url ? (
              <Badge variant="outline" className="self-center">
                Configurado: {detectSlackPlatform(config.url) === 'teams' ? 'Teams' : 'Slack'}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enviar notificacao de teste</CardTitle>
          <CardDescription>
            Usa o mesmo webhook salvo acima para postar uma mensagem de exemplo no canal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slack-event-type">Evento</Label>
              <Select
                value={eventType}
                onValueChange={(value) => setEventType(value as SlackEventType)}
              >
                <SelectTrigger id="slack-event-type" aria-label="Tipo de evento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLACK_EVENTS.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slack-recipient">E-mail de exemplo</Label>
              <Input
                id="slack-recipient"
                type="email"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slack-subject">Assunto de exemplo</Label>
              <Input
                id="slack-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={sendNotification.isPending || !platform || !recipientEmail.trim()}
            >
              {sendNotification.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Enviar teste
            </Button>
            <p className="text-xs text-muted-foreground">Limite de 30 envios por minuto por IP.</p>
          </div>

          <div aria-live="polite">
            {result ? (
              <Alert variant={result.ok ? 'default' : 'destructive'}>
                {result.ok ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                )}
                <AlertTitle>{result.ok ? 'Enviado' : 'Falhou'}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
