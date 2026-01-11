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
  Globe
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
    getReputationLevel,
    getDeliveryHealthStatus 
  } = useDeliverability();
  const [domainToCheck, setDomainToCheck] = useState('');

  const handleCheckDNS = () => {
    if (!domainToCheck.trim()) {
      toast.error('Digite um domínio para verificar');
      return;
    }
    checkDNS(domainToCheck.trim());
  };

  if (isLoading) {
    return (
      <div role="region" aria-label="DeliverabilityTab" className="space-y-6">
        <div role="region" aria-label="DeliverabilityTab" className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            />
            <Button onClick={handleCheckDNS} disabled={isCheckingDNS}>
              {isCheckingDNS ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Verificar
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


export const DeliverabilityTab = memo(DeliverabilityTabBase);
