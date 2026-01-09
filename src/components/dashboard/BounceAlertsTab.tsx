import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Bell, 
  Check, 
  RefreshCw, 
  Settings,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useBounceAlerts } from '@/hooks/use-bounce-alerts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function BounceAlertsTab() {
  const {
    alerts,
    thresholds,
    isLoading,
    unreadCount,
    updateThresholds,
    markAsRead,
    resolveAlert,
    checkAlerts,
    isCheckingAlerts,
  } = useBounceAlerts();

  const [showSettings, setShowSettings] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(thresholds?.bounce_rate_warning ?? 5);
  const [criticalThreshold, setCriticalThreshold] = useState(thresholds?.bounce_rate_critical ?? 10);

  const handleSaveThresholds = () => {
    updateThresholds({
      bounce_rate_warning: warningThreshold,
      bounce_rate_critical: criticalThreshold,
    });
  };

  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const resolvedAlerts = alerts.filter(a => a.is_resolved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div role="region" aria-label="BounceAlertsTab" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alertas de Bounce</h2>
          <p className="text-muted-foreground">
            Monitore taxas de bounce altas automaticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Limites
          </Button>
          <Button
            size="sm"
            onClick={() => checkAlerts()}
            disabled={isCheckingAlerts}
          >
            {isCheckingAlerts ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Verificar Agora
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card role="article">
          <CardHeader>
            <CardTitle className="text-lg">Configuração de Limites</CardTitle>
            <CardDescription>
              Defina os limites de taxa de bounce para gerar alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="region" aria-label="BounceAlertsTab" className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="warning">Limite de Aviso (%)</Label>
                <Input
                  id="warning"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Alerta amarelo quando bounce rate ≥ {warningThreshold}%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="critical">Limite Crítico (%)</Label>
                <Input
                  id="critical"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Alerta vermelho quando bounce rate ≥ {criticalThreshold}%
                </p>
              </div>
            </div>
            <Button onClick={handleSaveThresholds} className="mt-4">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card role="article">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card role="article">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Bell className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Não Lidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Alertas Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Nenhum alerta ativo</p>
              <p className="text-sm">Todas as taxas de bounce estão dentro dos limites</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    !alert.is_read ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      alert.alert_type === 'critical_bounce_rate' 
                        ? 'bg-destructive/10' 
                        : 'bg-yellow-500/10'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.alert_type === 'critical_bounce_rate'
                          ? 'text-destructive'
                          : 'text-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.domain}</span>
                        <Badge variant={
                          alert.alert_type === 'critical_bounce_rate' 
                            ? 'destructive' 
                            : 'secondary'
                        }>
                          {alert.alert_type === 'critical_bounce_rate' ? 'Crítico' : 'Aviso'}
                        </Badge>
                        {!alert.is_read && (
                          <Badge variant="outline" className="text-xs">Novo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Taxa de bounce: <span className="font-medium text-destructive">{alert.bounce_rate.toFixed(1)}%</span>
                        {' '}(limite: {alert.threshold}%)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Marcar como lido
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Alertas Resolvidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border opacity-60"
                >
                  <div>
                    <span className="font-medium">{alert.domain}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {alert.bounce_rate.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Resolvido em {format(new Date(alert.resolved_at!), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
