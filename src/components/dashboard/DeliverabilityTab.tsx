import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Shield, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  ShieldAlert,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useDeliverability, DomainStats } from '@/hooks/use-deliverability';
import { toast } from 'sonner';

function DeliverabilityTabBase() {
  const { 
    data, 
    isLoading, 
    refetch, 
    checkDNS, 
    isCheckingDNS, 
    dnsResult,
    checkBlacklist,
    isCheckingBlacklist,
    blacklistResult,
    getReputationLevel,
    getDeliveryHealthStatus 
  } = useDeliverability();
  const [domainToCheck, setDomainToCheck] = useState('');
  const [blacklistDomain, setBlacklistDomain] = useState('');

  const handleCheckDNS = () => {
    if (!domainToCheck.trim()) {
      toast.error('Digite um domínio para verificar');
      return;
    }
    checkDNS(domainToCheck.trim());
  };

  const handleCheckBlacklist = () => {
    if (!blacklistDomain.trim()) {
      toast.error('Digite um domínio para verificar');
      return;
    }
    checkBlacklist(blacklistDomain.trim());
  };

  if (isLoading) {
    return (
      <div role="region" aria-label="DeliverabilityTab" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totals = data?.totals;
  const domains = data?.domains || [];
  const reputationInfo = totals ? getReputationLevel(totals.reputationScore) : { level: 'N/A', color: 'text-muted-foreground' };
  const healthStatus = totals ? getDeliveryHealthStatus(totals.deliveryRate) : { status: 'N/A', color: 'bg-muted' };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <Badge variant="destructive">Crítico</Badge>;
      case 'high': return <Badge className="bg-orange-500">Alto</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Médio</Badge>;
      default: return <Badge className="bg-green-500">Baixo</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Deliverability</h2>
          <p className="text-muted-foreground">Acompanhe a reputação dos seus domínios e taxa de entrega</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card role="article">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Score de Reputação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${reputationInfo.color}`}>
                {totals?.reputationScore || 0}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <p className={`text-sm ${reputationInfo.color}`}>{reputationInfo.level}</p>
            <Progress value={totals?.reputationScore || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card role="article">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Taxa de Entrega
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totals?.deliveryRate.toFixed(1) || 0}%</span>
              <Badge className={healthStatus.color}>{healthStatus.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totals?.totalDelivered.toLocaleString() || 0} de {totals?.totalSent.toLocaleString() || 0} entregues
            </p>
          </CardContent>
        </Card>

        <Card role="article">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Taxa de Bounce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${(totals?.bounceRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {totals?.bounceRate.toFixed(1) || 0}%
              </span>
              {(totals?.bounceRate || 0) > 5 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totals?.totalBounced.toLocaleString() || 0} bounces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Taxa de Abertura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totals?.openRate.toFixed(1) || 0}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {totals?.totalOpened.toLocaleString() || 0} aberturas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blacklist Detection - NEW */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Verificação de Blacklist (DNSBL)
          </CardTitle>
          <CardDescription>
            Verifique se seu domínio está em listas negras de email (Spamhaus, Barracuda, SpamCop, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o domínio (ex: empresa.com)"
              value={blacklistDomain}
              onChange={(e) => setBlacklistDomain(e.target.value)}
              className="max-w-md"
              onKeyDown={(e) => e.key === 'Enter' && handleCheckBlacklist()}
            />
            <Button onClick={handleCheckBlacklist} disabled={isCheckingBlacklist}>
              {isCheckingBlacklist ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Verificar Blacklists
            </Button>
          </div>

          {isCheckingBlacklist && (
            <div className="border rounded-lg p-6 flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Verificando {BLACKLIST_COUNT} blacklists...</span>
            </div>
          )}

          {blacklistResult && !isCheckingBlacklist && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {blacklistResult.listed ? (
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">{blacklistResult.domain}</h4>
                    <p className="text-sm text-muted-foreground">
                      Verificado em {new Date(blacklistResult.checkedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRiskBadge(blacklistResult.riskLevel)}
                  <span className="text-sm text-muted-foreground">
                    {blacklistResult.totalListed}/{blacklistResult.totalChecked} listas
                  </span>
                </div>
              </div>

              {/* Blacklist Results Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {blacklistResult.results.map((result) => (
                  <div
                    key={result.host}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      result.listed 
                        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' 
                        : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                    }`}
                  >
                    {result.listed ? (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{result.blacklist}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.host}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {blacklistResult.recommendations.length > 0 && (
                <div className="mt-3 space-y-1 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Recomendações:</p>
                  {blacklistResult.recommendations.map((rec, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{rec}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verificação de DNS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Verificar Configuração DNS
          </CardTitle>
          <CardDescription>
            Verifique se SPF, DKIM e DMARC estão configurados corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o domínio (ex: empresa.com)"
              value={domainToCheck}
              onChange={(e) => setDomainToCheck(e.target.value)}
              className="max-w-md"
              onKeyDown={(e) => e.key === 'Enter' && handleCheckDNS()}
            />
            <Button onClick={handleCheckDNS} disabled={isCheckingDNS}>
              {isCheckingDNS ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Verificar DNS
            </Button>
          </div>

          {dnsResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Resultados para {dnsResult.domain}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {dnsResult.dns.spf ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>SPF</span>
                </div>
                <div className="flex items-center gap-2">
                  {dnsResult.dns.dkim ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>DKIM</span>
                </div>
                <div className="flex items-center gap-2">
                  {dnsResult.dns.dmarc ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>DMARC</span>
                </div>
              </div>
              {dnsResult.recommendations.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium">Recomendações:</p>
                  {dnsResult.recommendations.map((rec, i) => (
                    <p key={i} className="text-sm text-muted-foreground">• {rec}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Domínios */}
      <Card>
        <CardHeader>
          <CardTitle>Reputação por Domínio</CardTitle>
          <CardDescription>Métricas detalhadas de cada domínio de envio</CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum domínio de envio encontrado</p>
              <p className="text-sm">Envie emails rastreados para ver as métricas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Domínio</th>
                    <th className="text-right py-3 px-2 font-medium">Enviados</th>
                    <th className="text-right py-3 px-2 font-medium">Entregues</th>
                    <th className="text-right py-3 px-2 font-medium">Bounces</th>
                    <th className="text-right py-3 px-2 font-medium">Taxa Entrega</th>
                    <th className="text-right py-3 px-2 font-medium">Taxa Bounce</th>
                    <th className="text-right py-3 px-2 font-medium">Reputação</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain: DomainStats) => {
                    const repInfo = getReputationLevel(domain.reputation_score);
                    return (
                      <tr key={domain.domain} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{domain.domain}</td>
                        <td className="py-3 px-2 text-right">{Number(domain.total_sent).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">{Number(domain.total_delivered).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">{Number(domain.total_bounced).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={domain.delivery_rate >= 90 ? 'text-green-600' : 'text-yellow-600'}>
                            {Number(domain.delivery_rate).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={domain.bounce_rate <= 2 ? 'text-green-600' : 'text-red-600'}>
                            {Number(domain.bounce_rate).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Badge variant="outline" className={repInfo.color}>
                            {domain.reputation_score}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const BLACKLIST_COUNT = 8;

export const DeliverabilityTab = memo(DeliverabilityTabBase);
export default DeliverabilityTab;
