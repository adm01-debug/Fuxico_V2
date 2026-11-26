// =============================================================================
// FUXICO - Dominios Proprios Tab
// Permite registrar um dominio, exibir as instrucoes de verificacao, checar a
// prova publica e remover o dominio. Backend: verify-custom-domain.
// =============================================================================

import { useMemo, useState } from 'react';
import {
  DOMAIN_STATUS_LABELS,
  DOMAIN_VERIFICATION_LABELS,
  buildInstructions,
  isValidDomain,
  useCustomDomain,
  useRegisterCustomDomain,
  useRemoveCustomDomain,
  useVerifyCustomDomain,
  type CustomDomain,
  type DomainInstructions,
  type DomainVerificationType,
} from '@/hooks/use-custom-domains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { log } from '@/lib/logger';
import { matchFirst } from '@/lib/variant';
import { Check, Copy, Globe, Loader2, RefreshCw, ShieldCheck, Trash2, XCircle } from 'lucide-react';

function formatDate(value: string | null) {
  if (!value) return '\u2014';
  try {
    return format(new Date(value), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  } catch {
    return '\u2014';
  }
}

function statusClasses(status: CustomDomain['status']) {
  if (status === 'verified') return 'border-green-500/30 bg-green-500/10 text-green-600';
  if (status === 'failed') return 'border-red-500/30 bg-red-500/10 text-red-600';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-600';
}

function InstructionBlock({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
  copied: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} readOnly className="font-mono text-xs" aria-label={label} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy(value, label)}
          aria-label={`Copiar ${label}`}
        >
          {copied === value ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function InstructionsCard({
  instructions,
  onCopy,
  copied,
}: {
  instructions: DomainInstructions;
  onCopy: (value: string, label: string) => void;
  copied: string | null;
}) {
  return (
    <div className="space-y-4">
      {matchFirst(
        [
          [
            instructions.type === 'dns',
            () => (
              <>
                <p className="text-sm text-muted-foreground">
                  Crie um registro TXT no seu provedor de DNS com os dados abaixo.
                </p>
                {instructions.type === 'dns' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InstructionBlock
                      label="Nome do registro"
                      value={instructions.recordName}
                      onCopy={onCopy}
                      copied={copied}
                    />
                    <InstructionBlock
                      label="Tipo"
                      value={instructions.recordType}
                      onCopy={onCopy}
                      copied={copied}
                    />
                    <div className="sm:col-span-2">
                      <InstructionBlock
                        label="Valor (token)"
                        value={instructions.recordValue}
                        onCopy={onCopy}
                        copied={copied}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ),
          ],
          [
            instructions.type === 'file',
            () => (
              <>
                <p className="text-sm text-muted-foreground">
                  Publique um arquivo de texto na raiz do dominio, acessivel publicamente, com o
                  conteudo abaixo.
                </p>
                {instructions.type === 'file' ? (
                  <>
                    <InstructionBlock
                      label="URL do arquivo"
                      value={instructions.fileUrl}
                      onCopy={onCopy}
                      copied={copied}
                    />
                    <InstructionBlock
                      label="Conteudo do arquivo"
                      value={instructions.fileContent}
                      onCopy={onCopy}
                      copied={copied}
                    />
                  </>
                ) : null}
              </>
            ),
          ],
        ],
        () => (
          <>
            <p className="text-sm text-muted-foreground">
              Adicione a meta tag abaixo dentro da tag <code>&lt;head&gt;</code> da pagina inicial
              do dominio.
            </p>
            {instructions.type === 'meta' ? (
              <InstructionBlock
                label="Meta tag"
                value={instructions.metaTag}
                onCopy={onCopy}
                copied={copied}
              />
            ) : null}
          </>
        )
      )}
    </div>
  );
}

export default function CustomDomainsTab() {
  const { data: domain, isLoading, isFetching, refetch } = useCustomDomain();
  const registerDomain = useRegisterCustomDomain();
  const verifyDomain = useVerifyCustomDomain();
  const removeDomain = useRemoveCustomDomain();

  const [domainInput, setDomainInput] = useState('');
  const [verificationType, setVerificationType] = useState<DomainVerificationType>('dns');
  const [copied, setCopied] = useState<string | null>(null);

  const instructions = useMemo(() => {
    if (!domain) return null;
    return buildInstructions(
      domain.verification_type,
      domain.domain,
      domain.verification_token ?? ''
    );
  }, [domain]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 2000);
      toast({ title: `${label} copiado` });
    } catch (error) {
      log.error('CustomDomainsTab: falha ao copiar', error);
      toast({ title: 'Nao foi possivel copiar', variant: 'destructive' });
    }
  };

  const handleRegister = async () => {
    const value = domainInput.trim().toLowerCase();
    if (!isValidDomain(value)) {
      toast({
        title: 'Dominio invalido',
        description: 'Use o formato exemplo.com.br, sem http:// e sem caminho.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await registerDomain.mutateAsync({ domain: value, verificationType });
      setDomainInput('');
      toast({
        title: 'Dominio registrado',
        description: 'Siga as instrucoes e clique em Verificar agora.',
      });
    } catch (error) {
      log.error('CustomDomainsTab: falha ao registrar dominio', error);
      toast({
        title: 'Erro ao registrar dominio',
        description: 'Verifique o dominio e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async () => {
    if (!domain) return;

    try {
      const result = await verifyDomain.mutateAsync({
        domain: domain.domain,
        verificationType: domain.verification_type,
      });
      toast({
        title: result.verified ? 'Dominio verificado' : 'Verificacao pendente',
        description: result.message,
        variant: result.verified ? 'default' : 'destructive',
      });
    } catch (error) {
      log.error('CustomDomainsTab: falha ao verificar dominio', error);
      toast({
        title: 'Erro ao verificar',
        description: 'Nao foi possivel consultar a prova publica agora.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async () => {
    try {
      await removeDomain.mutateAsync();
      toast({ title: 'Dominio removido', description: 'Voce pode registrar outro dominio.' });
    } catch (error) {
      log.error('CustomDomainsTab: falha ao remover dominio', error);
      toast({ title: 'Erro ao remover o dominio', variant: 'destructive' });
    }
  };

  return (
    <div role="region" aria-label="Dominios proprios" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Dominio proprio</CardTitle>
          </div>
          <CardDescription>
            Use um dominio da sua marca nos links rastreados e nas paginas publicas. Um dominio por
            conta; links com dominio proprio tem mais confianca e menos chance de cair em spam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {matchFirst(
            [
              [
                isLoading,
                () => (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                  </div>
                ),
              ],
              [
                Boolean(domain),
                () => (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {domain?.verified ? (
                          <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                        ) : (
                          <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{domain?.domain}</p>
                          <p className="text-xs text-muted-foreground">
                            {domain ? DOMAIN_VERIFICATION_LABELS[domain.verification_type] : ''}{' '}
                            \u00b7 registrado em {formatDate(domain?.created_at ?? null)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={domain ? statusClasses(domain.status) : undefined}
                        >
                          {domain?.verified ? (
                            <Check className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {domain ? DOMAIN_STATUS_LABELS[domain.status] : ''}
                        </Badge>
                        <Button size="sm" onClick={handleVerify} disabled={verifyDomain.isPending}>
                          {verifyDomain.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Verificar agora
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={removeDomain.isPending}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover dominio?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Os links que usam {domain?.domain} deixam de funcionar com esse
                                dominio. Voce pode registrar novamente depois.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRemove}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Passo a passo para verificar</p>
                      {instructions ? (
                        <InstructionsCard
                          instructions={instructions}
                          onCopy={copy}
                          copied={copied}
                        />
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Ultima checagem: {formatDate(domain?.updated_at ?? null)}. A propagacao de
                        DNS pode levar alguns minutos apos a criacao do registro.
                      </p>
                    </div>
                  </div>
                ),
              ],
            ],
            () => (
              <div className="space-y-4">
                <EmptyState
                  type="webhooks"
                  title="Nenhum dominio registrado"
                  description="Registre o dominio da sua marca para enviar emails e links com a sua identidade."
                  size="sm"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="custom-domain">Dominio</Label>
                    <Input
                      id="custom-domain"
                      value={domainInput}
                      onChange={(event) => setDomainInput(event.target.value)}
                      placeholder="Ex.: links.suaempresa.com.br"
                      maxLength={100}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2 sm:w-56">
                    <Label htmlFor="custom-domain-type">Forma de verificacao</Label>
                    <Select
                      value={verificationType}
                      onValueChange={(value) =>
                        setVerificationType(value as DomainVerificationType)
                      }
                    >
                      <SelectTrigger id="custom-domain-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dns">Registro DNS (TXT)</SelectItem>
                        <SelectItem value="file">Arquivo no servidor</SelectItem>
                        <SelectItem value="meta">Meta tag no HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRegister} disabled={registerDomain.isPending}>
                    {registerDomain.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="mr-2 h-4 w-4" />
                    )}
                    Adicionar dominio
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="w-fit"
                >
                  {isFetching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Atualizar
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
