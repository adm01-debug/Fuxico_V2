// =============================================================================
// FUXICO - Webhook Configuration Tab
// =============================================================================

import { useState, useEffect } from 'react';
import {
  useWebhookConfig,
  useWebhookLogs,
  useSaveWebhookConfig,
  useTestWebhook,
} from '@/hooks/use-webhook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle, XCircle, Webhook, Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { log } from '@/lib/logger';
import { matchFirst } from '@/lib/variant';

const AVAILABLE_EVENTS = [
  {
    id: 'email_open',
    label: 'Email Aberto',
    description: 'Quando um email é aberto pelo destinatário',
  },
  { id: 'link_click', label: 'Link Clicado', description: 'Quando um link rastreado é clicado' },
  { id: 'bounce', label: 'Bounce', description: 'Quando um email retorna como não entregue' },
  {
    id: 'document_view',
    label: 'Documento Visualizado',
    description: 'Quando um documento é aberto',
  },
  {
    id: 'document_download',
    label: 'Documento Baixado',
    description: 'Quando um documento é baixado',
  },
];

export default function WebhookTab() {
  const { data: config, isLoading: configLoading } = useWebhookConfig();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useWebhookLogs(50);
  const saveConfig = useSaveWebhookConfig();
  const testWebhook = useTestWebhook();

  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(['email_open', 'link_click', 'bounce']);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (config) {
      setUrl(config.url || '');
      setSecret(config.secret || '');
      setEvents(config.events || ['email_open', 'link_click', 'bounce']);
      setIsActive(config.is_active ?? true);
    }
  }, [config]);

  const handleEventToggle = (eventId: string, checked: boolean) => {
    if (checked) {
      setEvents((prev) => [...prev, eventId]);
    } else {
      setEvents((prev) => prev.filter((e) => e !== eventId));
    }
  };

  const handleSave = async () => {
    if (!url) {
      toast({
        title: 'URL obrigatória',
        description: 'Informe a URL do webhook',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveConfig.mutateAsync({
        url,
        secret: secret || undefined,
        events,
        is_active: isActive,
      });
      toast({ title: 'Configuração salva', description: 'Webhook configurado com sucesso' });
    } catch (error) {
      log.error('WebhookTab: falha ao salvar configuração', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async () => {
    if (!url) {
      toast({
        title: 'URL obrigatória',
        description: 'Informe a URL do webhook para testar',
        variant: 'destructive',
      });
      return;
    }

    try {
      await testWebhook.mutateAsync(url);
      toast({ title: 'Teste enviado', description: 'Requisição de teste enviada para o webhook' });
      setTimeout(() => refetchLogs(), 2000);
    } catch (error) {
      log.error('WebhookTab: falha no teste de webhook', error);
      toast({
        title: 'Erro no teste',
        description: 'Falha ao enviar requisição de teste',
        variant: 'destructive',
      });
    }
  };

  if (configLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div role="region" aria-label="WebhookTab" className="space-y-6">
      {/* Configuration Card */}
      <Card role="article">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <CardTitle>Configuração de Webhook</CardTitle>
          </div>
          <CardDescription>
            Configure um endpoint para receber notificações em tempo real sobre eventos de
            rastreamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://seu-sistema.com/api/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Endpoint que receberá as notificações via POST
            </p>
          </div>

          {/* Secret Input */}
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Secret (opcional)</Label>
            <Input
              id="webhook-secret"
              type="password"
              placeholder="Chave secreta para validação"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Será enviado no header X-Webhook-Secret para validação
            </p>
          </div>

          <Separator />

          {/* Events Selection */}
          <div className="space-y-4">
            <Label>Eventos para notificar</Label>
            <div role="region" aria-label="WebhookTab" className="grid gap-3">
              {AVAILABLE_EVENTS.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <Checkbox
                    id={event.id}
                    checked={events.includes(event.id)}
                    onCheckedChange={(checked) => handleEventToggle(event.id, checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={event.id} className="cursor-pointer font-medium">
                      {event.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <Label htmlFor="webhook-active" className="font-medium">
                Webhook ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Desative para pausar o envio de notificações
              </p>
            </div>
            <Switch id="webhook-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saveConfig.isPending} className="flex-1">
              {saveConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Configuração
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testWebhook.isPending || !url}>
              {testWebhook.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Histórico de Envios</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
              Atualizar
            </Button>
          </div>
          <CardDescription>Últimos 50 webhooks enviados e seus status</CardDescription>
        </CardHeader>
        <CardContent>
          {matchFirst(
            [
              [
                logsLoading,
                () => (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ),
              ],
              [
                !logs || logs.length === 0,
                () => (
                  <EmptyState
                    type="webhooks"
                    title="Nenhum webhook enviado ainda"
                    description="Configure um webhook e teste a conexão para ver os logs aqui."
                    size="sm"
                  />
                ),
              ],
            ],
            () => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Código HTTP</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs ?? []).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.success ? (
                          <Badge
                            variant="default"
                            className="border-green-500/20 bg-green-500/10 text-green-600"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="border-red-500/20 bg-red-500/10 text-red-600"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.response_status ? (
                          <code className="rounded bg-muted px-2 py-1 text-sm">
                            {log.response_status}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {log.error || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
