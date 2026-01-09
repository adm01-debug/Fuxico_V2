import { memo } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Slack, MessageSquare, Save, TestTube, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface IntegrationConfig {
  id?: string;
  platform: 'slack' | 'teams';
  webhookUrl: string;
  enabled: boolean;
  events: string[];
}

const EVENT_OPTIONS = [
  { id: 'open', label: 'Email Aberto' },
  { id: 'click', label: 'Link Clicado' },
  { id: 'bounce', label: 'Email Retornado' },
  { id: 'reply', label: 'Resposta Recebida' },
  { id: 'document_view', label: 'Documento Visualizado' },
];

function IntegrationsTabBase() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const [slackConfig, setSlackConfig] = useState<IntegrationConfig>({
    platform: 'slack',
    webhookUrl: '',
    enabled: false,
    events: ['open', 'click'],
  });

  const [teamsConfig, setTeamsConfig] = useState<IntegrationConfig>({
    platform: 'teams',
    webhookUrl: '',
    enabled: false,
    events: ['open', 'click'],
  });

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('user_id', user?.id)
        .in('url', ['slack://', 'teams://'])
        .or('url.ilike.%slack%,url.ilike.%teams%,url.ilike.%office%');

      if (error) throw error;

      data?.forEach((config) => {
        if (config.url?.includes('slack') || config.url?.startsWith('slack://')) {
          setSlackConfig({
            id: config.id,
            platform: 'slack',
            webhookUrl: config.url.replace('slack://', ''),
            enabled: config.is_active,
            events: config.events || ['open', 'click'],
          });
        } else if (config.url?.includes('office') || config.url?.includes('teams') || config.url?.startsWith('teams://')) {
          setTeamsConfig({
            id: config.id,
            platform: 'teams',
            webhookUrl: config.url.replace('teams://', ''),
            enabled: config.is_active,
            events: config.events || ['open', 'click'],
          });
        }
      });
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveIntegration = async (config: IntegrationConfig) => {
    if (!user) return;
    setSaving(true);

    try {
      const webhookData = {
        user_id: user.id,
        url: config.webhookUrl,
        is_active: config.enabled,
        events: config.events,
      };

      if (config.id) {
        const { error } = await supabase
          .from('webhook_configs')
          .update(webhookData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('webhook_configs')
          .insert(webhookData)
          .select()
          .single();
        if (error) throw error;
        
        if (config.platform === 'slack') {
          setSlackConfig((prev) => ({ ...prev, id: data.id }));
        } else {
          setTeamsConfig((prev) => ({ ...prev, id: data.id }));
        }
      }

      toast.success(`Integração ${config.platform === 'slack' ? 'Slack' : 'Teams'} salva com sucesso!`);
    } catch (error) {
      console.error('Error saving integration:', error);
      toast.error('Erro ao salvar integração');
    } finally {
      setSaving(false);
    }
  };

  const testIntegration = async (config: IntegrationConfig) => {
    if (!config.webhookUrl) {
      toast.error('Configure a URL do webhook primeiro');
      return;
    }

    setTesting(config.platform);

    try {
      const { data, error } = await supabase.functions.invoke('send-slack-notification', {
        body: {
          webhookUrl: config.webhookUrl,
          platform: config.platform,
          eventType: 'open',
          data: {
            recipientEmail: 'teste@exemplo.com',
            subject: 'Email de Teste - FUXICO',
            trackingId: 'test-123',
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      toast.success(`Notificação de teste enviada para ${config.platform === 'slack' ? 'Slack' : 'Teams'}!`);
    } catch (error) {
      console.error('Error testing integration:', error);
      toast.error('Erro ao enviar notificação de teste');
    } finally {
      setTesting(null);
    }
  };

  const toggleEvent = (config: IntegrationConfig, setConfig: React.Dispatch<React.SetStateAction<IntegrationConfig>>, eventId: string) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div role="region" aria-label="IntegrationsTab" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrações</h2>
        <p className="text-muted-foreground">
          Configure notificações em tempo real para Slack e Microsoft Teams
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Slack Integration */}
        <Card role="article">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]">
                  <Slack className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Slack</CardTitle>
                  <CardDescription>Receba notificações no Slack</CardDescription>
                </div>
              </div>
              <Badge variant={slackConfig.enabled ? 'default' : 'secondary'}>
                {slackConfig.enabled ? (
                  <><CheckCircle2 className="mr-1 h-3 w-3" /> Ativo</>
                ) : (
                  <><XCircle className="mr-1 h-3 w-3" /> Inativo</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="slack-enabled">Ativar integração</Label>
              <Switch
                id="slack-enabled"
                checked={slackConfig.enabled}
                onCheckedChange={(checked) => setSlackConfig((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slack-webhook">Webhook URL</Label>
              <Input
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackConfig.webhookUrl}
                onChange={(e) => setSlackConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Crie um webhook em: Slack → Apps → Incoming Webhooks
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos para notificar</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_OPTIONS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`slack-${event.id}`}
                      checked={slackConfig.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(slackConfig, setSlackConfig, event.id)}
                    />
                    <label htmlFor={`slack-${event.id}`} className="text-sm">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => saveIntegration(slackConfig)}
                disabled={saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => testIntegration(slackConfig)}
                disabled={testing === 'slack' || !slackConfig.webhookUrl}
              >
                {testing === 'slack' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                Testar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams Integration */}
        <Card role="article">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5059C9]">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Microsoft Teams</CardTitle>
                  <CardDescription>Receba notificações no Teams</CardDescription>
                </div>
              </div>
              <Badge variant={teamsConfig.enabled ? 'default' : 'secondary'}>
                {teamsConfig.enabled ? (
                  <><CheckCircle2 className="mr-1 h-3 w-3" /> Ativo</>
                ) : (
                  <><XCircle className="mr-1 h-3 w-3" /> Inativo</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="teams-enabled">Ativar integração</Label>
              <Switch
                id="teams-enabled"
                checked={teamsConfig.enabled}
                onCheckedChange={(checked) => setTeamsConfig((prev) => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teams-webhook">Webhook URL</Label>
              <Input
                id="teams-webhook"
                type="url"
                placeholder="https://outlook.office.com/webhook/..."
                value={teamsConfig.webhookUrl}
                onChange={(e) => setTeamsConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Crie um webhook em: Teams → Canal → Connectors → Incoming Webhook
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos para notificar</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_OPTIONS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`teams-${event.id}`}
                      checked={teamsConfig.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(teamsConfig, setTeamsConfig, event.id)}
                    />
                    <label htmlFor={`teams-${event.id}`} className="text-sm">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => saveIntegration(teamsConfig)}
                disabled={saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => testIntegration(teamsConfig)}
                disabled={testing === 'teams' || !teamsConfig.webhookUrl}
              >
                {testing === 'teams' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                Testar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card role="article">
        <CardHeader>
          <CardTitle>Como configurar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Slack</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse seu workspace do Slack</li>
              <li>Vá em Configurações → Gerenciar Apps → Incoming Webhooks</li>
              <li>Clique em "Add New Webhook to Workspace"</li>
              <li>Escolha o canal e copie a URL do webhook</li>
              <li>Cole a URL no campo acima e salve</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Microsoft Teams</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Abra o Microsoft Teams</li>
              <li>Vá ao canal desejado → (...) → Connectors</li>
              <li>Procure por "Incoming Webhook" e configure</li>
              <li>Dê um nome e copie a URL gerada</li>
              <li>Cole a URL no campo acima e salve</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export const IntegrationsTab = memo(IntegrationsTabBase);
