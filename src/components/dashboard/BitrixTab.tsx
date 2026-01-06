import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Activity, 
  Briefcase, 
  Settings, 
  RefreshCw,
  Mail,
  MousePointer,
  FileText,
  Building2,
  Phone,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useBitrix24Config,
  useBitrix24Contacts,
  useBitrix24Activities,
  useBitrix24Deals
} from '@/hooks/use-bitrix24';
import type { Bitrix24Activity } from '@/hooks/use-bitrix24';

function ActivityIcon({ type }: { type: Bitrix24Activity['type'] }) {
  switch (type) {
    case 'email_open':
      return <Mail className="h-4 w-4 text-blue-500" />;
    case 'link_click':
      return <MousePointer className="h-4 w-4 text-green-500" />;
    case 'document_view':
      return <FileText className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

function ContactsPanel() {
  const { data: contacts, isLoading, refetch } = useBitrix24Contacts();
  const { config } = useBitrix24Config();

  if (!config.webhookUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Configure o webhook do Bitrix24 na aba Configuração</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {contacts?.length || 0} contatos sincronizados
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {contacts?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum contato encontrado</p>
          ) : contacts?.map(contact => (
            <Card key={contact.id} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    {contact.company && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {contact.company}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {contact.source && (
                      <Badge variant="secondary" className="text-xs">
                        {contact.source}
                      </Badge>
                    )}
                    {contact.lastActivity && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(contact.lastActivity), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ActivitiesPanel() {
  const { data: activities, isLoading, refetch } = useBitrix24Activities();
  const { config } = useBitrix24Config();

  if (!config.webhookUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Configure o webhook do Bitrix24 na aba Configuração</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {activities?.length || 0} atividades registradas
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {activities?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma atividade encontrada</p>
          ) : activities?.map(activity => (
            <Card key={activity.id} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">{activity.contactName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function DealsPanel() {
  const { data: deals, isLoading, refetch } = useBitrix24Deals();
  const { config } = useBitrix24Config();

  if (!config.webhookUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Configure o webhook do Bitrix24 na aba Configuração</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {deals?.length || 0} negócios criados
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {deals?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum negócio encontrado</p>
          ) : deals?.map(deal => (
            <Card key={deal.id} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-sm text-muted-foreground">{deal.contactName}</p>
                    <Badge variant="outline">{deal.stage}</Badge>
                  </div>
                  <div className="text-right">
                    {deal.value && (
                      <p className="font-semibold text-green-600 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {deal.value.toLocaleString('pt-BR')} {deal.currency}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(deal.createdAt), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConfigPanel() {
  const { config, updateConfig, isUpdating } = useBitrix24Config();
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const isConfigured = !!config.webhookUrl;

  const handleSaveWebhook = () => {
    updateConfig({ webhookUrl: webhookUrl || null });
  };

  return (
    <div className="space-y-6" role="region" aria-label="Integração Bitrix24">
      <Card role="article">
        <CardHeader>
          <CardTitle className="text-base">Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isConfigured ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Webhook não configurado</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Conectado ao Bitrix24</span>
                </>
              )}
            </div>
            <Badge variant={!isConfigured ? 'secondary' : 'default'}>
              {!isConfigured ? 'Não configurado' : 'Conectado'}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL do Bitrix24</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://seu-dominio.bitrix24.com.br/rest/..."
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
              />
              <Button onClick={handleSaveWebhook} disabled={isUpdating}>
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure o webhook do Bitrix24 para sincronizar dados reais.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card role="article">
        <CardHeader>
          <CardTitle className="text-base">Automações</CardTitle>
          <CardDescription>
            Configure quais ações são sincronizadas automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronizar contatos</Label>
              <p className="text-xs text-muted-foreground">
                Criar/atualizar contatos ao rastrear emails
              </p>
            </div>
            <Switch
              checked={config.autoSyncContacts}
              onCheckedChange={checked => updateConfig({ autoSyncContacts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Registrar atividades</Label>
              <p className="text-xs text-muted-foreground">
                Registrar aberturas, cliques e visualizações
              </p>
            </div>
            <Switch
              checked={config.autoRegisterActivities}
              onCheckedChange={checked => updateConfig({ autoRegisterActivities: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Criar negócios</Label>
              <p className="text-xs text-muted-foreground">
                Criar negócio automaticamente para novos contatos
              </p>
            </div>
            <Switch
              checked={config.autoCreateDeals}
              onCheckedChange={checked => updateConfig({ autoCreateDeals: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações</Label>
              <p className="text-xs text-muted-foreground">
                Enviar notificações no Bitrix24 para eventos importantes
              </p>
            </div>
            <Switch
              checked={config.sendNotifications}
              onCheckedChange={checked => updateConfig({ sendNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BitrixTab() {
  const { config } = useBitrix24Config();

  return (
    <div className="space-y-6" role="region" aria-label="Integração Bitrix24">
      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Integração Bitrix24</CardTitle>
                <CardDescription>
                  Sincronize contatos, atividades e negócios com seu CRM
                </CardDescription>
              </div>
            </div>
            <Badge variant={config.enabled ? 'default' : 'secondary'}>
              {config.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activities">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Atividades</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Contatos</span>
              </TabsTrigger>
              <TabsTrigger value="deals" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Negócios</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activities" className="mt-4">
              <ActivitiesPanel />
            </TabsContent>
            <TabsContent value="contacts" className="mt-4">
              <ContactsPanel />
            </TabsContent>
            <TabsContent value="deals" className="mt-4">
              <DealsPanel />
            </TabsContent>
            <TabsContent value="config" className="mt-4">
              <ConfigPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for lazy loading
export default BitrixTab;
