// =============================================================================
// FUXICO - API Keys / Zapier Integration Tab
// =============================================================================

import { useMemo, useState } from 'react';
import {
  API_KEYS_QUERY_KEY,
  maskApiKey,
  useApiKeys,
  useCreateApiKey,
  useSetApiKeyActive,
  useTestApiKey,
  zapierWebhookUrl,
  type ApiKey,
} from '@/hooks/use-api-keys';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { log } from '@/lib/logger';
import { matchFirst } from '@/lib/variant';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react';

function formatDate(value: string | null) {
  if (!value) return '\u2014';
  try {
    return format(new Date(value), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  } catch {
    return '\u2014';
  }
}

const ZAPIER_PAYLOAD_EXAMPLE = `{
  "event": "lead_capturado",
  "trackingId": "00000000-0000-0000-0000-000000000000",
  "data": { "origem": "landing", "plano": "pro" }
}`;

export default function ApiKeysTab() {
  const queryClient = useQueryClient();
  const { data: apiKeys, isLoading, isFetching } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const setActive = useSetApiKeyActive();
  const testApiKey = useTestApiKey();

  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const webhookUrl = useMemo(() => zapierWebhookUrl(), []);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(null), 2000);
      toast({ title: `${label} copiado` });
    } catch (error) {
      log.error('ApiKeysTab: falha ao copiar', error);
      toast({ title: 'Nao foi possivel copiar', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    try {
      const created = await createApiKey.mutateAsync({ name: newKeyName });
      setCreatedKey(created);
      setNewKeyName('');
      toast({
        title: 'Chave criada',
        description: 'Copie a chave agora e guarde em local seguro.',
      });
    } catch (error) {
      log.error('ApiKeysTab: falha ao criar chave', error);
      toast({
        title: 'Erro ao criar chave',
        description: 'Verifique sua conexao e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (key: ApiKey, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ id: key.id, isActive });
      toast({
        title: isActive ? 'Chave reativada' : 'Chave desativada',
        description: isActive
          ? 'A chave volta a aceitar chamadas do Zapier.'
          : 'Chamadas com esta chave serao recusadas.',
      });
    } catch (error) {
      log.error('ApiKeysTab: falha ao alterar chave', error);
      toast({ title: 'Erro ao alterar a chave', variant: 'destructive' });
    }
  };

  const handleTest = async (key: ApiKey) => {
    const result = await testApiKey.mutateAsync(key.key);
    if (result.success) {
      toast({ title: 'Chave valida', description: 'O webhook respondeu 200 OK.' });
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    } else {
      toast({
        title: 'Chave recusada',
        description: `O webhook respondeu HTTP ${result.status}.`,
        variant: 'destructive',
      });
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div role="region" aria-label="Chaves de API" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>Chaves de API</CardTitle>
          </div>
          <CardDescription>
            Chaves usadas por sistemas externos (Zapier, automacoes e integracoes proprias) para
            enviar eventos ao FUXICO.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="api-key-name">Nome da chave</Label>
              <Input
                id="api-key-name"
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder="Ex.: Zapier - leads do site"
                maxLength={60}
              />
            </div>
            <Button onClick={handleCreate} disabled={createApiKey.isPending}>
              {createApiKey.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Gerar nova chave
            </Button>
          </div>

          {createdKey ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Chave criada com sucesso</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Guarde esta chave em um gerenciador de segredos. Ela identifica a sua conta nas
                chamadas ao webhook.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code
                  className="flex-1 overflow-x-auto rounded bg-background px-2 py-2 text-xs"
                  aria-label="Chave de API recem-criada"
                >
                  {createdKey.key}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(createdKey.key, 'Chave')}
                  aria-label="Copiar chave recem-criada"
                >
                  {copiedValue === createdKey.key ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCreatedKey(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Suas chaves</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY })}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>

          {matchFirst(
            [
              [
                isLoading,
                () => (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ),
              ],
              [
                !apiKeys || apiKeys.length === 0,
                () => (
                  <EmptyState
                    type="webhooks"
                    title="Nenhuma chave criada"
                    description="Gere a primeira chave para integrar o FUXICO ao Zapier ou a outra automacao."
                    size="sm"
                  />
                ),
              ],
            ],
            () => (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Chave</TableHead>
                      <TableHead>Criada em</TableHead>
                      <TableHead>Ultimo uso</TableHead>
                      <TableHead>Ativa</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(apiKeys ?? []).map((key) => {
                      const revealed = revealedIds.includes(key.id);
                      return (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">
                            {key.name || <span className="text-muted-foreground">Sem nome</span>}
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {revealed ? key.key : maskApiKey(key.key)}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(key.last_used_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                key.is_active
                                  ? 'border-green-500/30 bg-green-500/10 text-green-600'
                                  : 'border-red-500/30 bg-red-500/10 text-red-600'
                              }
                            >
                              {key.is_active ? 'Ativa' : 'Desativada'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleReveal(key.id)}
                                aria-label={revealed ? 'Ocultar chave' : 'Revelar chave'}
                              >
                                {revealed ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copy(key.key, 'Chave')}
                                aria-label="Copiar chave"
                              >
                                {copiedValue === key.key ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTest(key)}
                                disabled={testApiKey.isPending || !key.is_active}
                                aria-label="Testar chave"
                              >
                                {testApiKey.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              <Switch
                                checked={key.is_active}
                                onCheckedChange={(checked) => handleToggle(key, checked)}
                                disabled={setActive.isPending}
                                aria-label={key.is_active ? 'Desativar chave' : 'Ativar chave'}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            <CardTitle>Integracao com Zapier</CardTitle>
          </div>
          <CardDescription>
            Use o webhook abaixo em uma acao do tipo &quot;Webhooks by Zapier&quot; para registrar
            eventos no FUXICO.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zapier-url">URL do webhook</Label>
            <div className="flex items-center gap-2">
              <Input id="zapier-url" value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(webhookUrl, 'URL')}
                aria-label="Copiar URL do webhook"
              >
                {copiedValue === webhookUrl ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zapier-header">Cabecalho de autenticacao</Label>
            <Input
              id="zapier-header"
              value="x-api-key: SUA_CHAVE"
              readOnly
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zapier-payload">Corpo da requisicao (JSON)</Label>
            <pre
              id="zapier-payload"
              className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-xs"
            >
              <code>{ZAPIER_PAYLOAD_EXAMPLE}</code>
            </pre>
            <p className="text-xs text-muted-foreground">
              Eventos aceitos sao registrados no seu historico de webhooks, junto com a origem
              &quot;zapier&quot;.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
