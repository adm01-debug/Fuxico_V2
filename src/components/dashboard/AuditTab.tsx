import { memo } from 'react';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Globe, 
  TrendingUp,
  CheckCircle,
  Users,
  Mail,
  Shield,
  ExternalLink,
  Settings,
  UserCog
} from "lucide-react";
import { AuditConfigTab } from "./AuditConfigTab";
import { UserRolesTab } from "./UserRolesTab";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  useIsAdmin, 
  useEmailAuditLogs, 
  useFraudAlerts, 
  useResolveAlert,
  useAuditStats,
  useUserActivitySummary,
  type FraudAlert,
  type EmailAuditLog
} from "@/hooks/use-email-audit";
import { toast } from "sonner";

const alertTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  suspicious_hours: { label: "Horário Suspeito", icon: <Clock className="h-4 w-4" /> },
  external_recipient: { label: "Destinatário Externo", icon: <Globe className="h-4 w-4" /> },
  volume_anomaly: { label: "Volume Anormal", icon: <TrendingUp className="h-4 w-4" /> },
};

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function AuditTabBase() {
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: stats } = useAuditStats();
  const { data: alerts = [], isLoading: isLoadingAlerts } = useFraudAlerts(showResolved);
  const { data: logs = [], isLoading: isLoadingLogs } = useEmailAuditLogs({
    direction: directionFilter === "all" ? undefined : directionFilter as 'sent' | 'received',
  });
  const { data: userActivity = [] } = useUserActivitySummary();
  const resolveAlert = useResolveAlert();

  // Filter alerts by severity and type
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.alert_type === typeFilter;
    return matchesSeverity && matchesType;
  });

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success("Alerta marcado como resolvido");
    } catch (error) {
      toast.error("Erro ao resolver alerta");
    }
  };

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card role="article">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Apenas administradores podem acessar o painel de auditoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Painel de Auditoria de Emails">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Recebidos</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReceived || 0}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Externos</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.externalEmails || 0}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendentes" aria-live="polite</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.unresolvedAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Não resolvidos</p>
          </CardContent>
        </Card>
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas de Fraude
            {(stats?.unresolvedAlerts || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats?.unresolvedAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Mail className="h-4 w-4" />
            Logs de Email
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Atividade por Usuário
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <UserCog className="h-4 w-4" />
            Gerenciar Roles
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card role="article">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alertas de Fraude</CardTitle>
                    <CardDescription>
                      Atividades suspeitas detectadas automaticamente
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-resolved"
                      checked={showResolved}
                      onCheckedChange={setShowResolved}
                    />
                    <Label htmlFor="show-resolved">Mostrar resolvidos</Label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas severidades</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Tipo de alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="suspicious_hours">Horário Suspeito</SelectItem>
                      <SelectItem value="external_recipient">Destinatário Externo</SelectItem>
                      <SelectItem value="volume_anomaly">Volume Anormal</SelectItem>
                    </SelectContent>
                  </Select>
                  {(severityFilter !== "all" || typeFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSeverityFilter("all");
                        setTypeFilter("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhum alerta {showResolved ? "" : "pendente"} {(severityFilter !== "all" || typeFilter !== "all") ? "com os filtros selecionados" : ""}</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table aria-label="Tabela de logs de auditoria">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Severidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <AlertRow
                          key={alert.id}
                          alert={alert}
                          onResolve={handleResolveAlert}
                          isResolving={resolveAlert.isPending}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card role="article">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs de Email</CardTitle>
                  <CardDescription>
                    Histórico completo de emails enviados e recebidos
                  </CardDescription>
                </div>
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="received">Recebidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log de email encontrado</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table aria-label="Tabela de logs de auditoria">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Direção</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>De/Para</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Externo</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <LogRow key={log.id} log={log} />
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card role="article">
            <CardHeader>
              <CardTitle>Atividade por Usuário</CardTitle>
              <CardDescription>
                Resumo de emails por usuário hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade registrada hoje</p>
                </div>
              ) : (
                <Table aria-label="Tabela de logs de auditoria">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-center">Enviados</TableHead>
                      <TableHead className="text-center">Recebidos</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.user_email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            {user.sent}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <ArrowDownLeft className="h-3 w-3" />
                            {user.received}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {user.sent + user.received}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <UserRolesTab />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <AuditConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertRow({ 
  alert, 
  onResolve, 
  isResolving 
}: { 
  alert: FraudAlert; 
  onResolve: (id: string) => void;
  isResolving: boolean;
}) {
  const alertType = alertTypeLabels[alert.alert_type] || { 
    label: alert.alert_type, 
    icon: <AlertTriangle className="h-4 w-4" /> 
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {alertType.icon}
          <span className="text-sm">{alertType.label}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">{alert.user_email}</TableCell>
      <TableCell className="max-w-[300px] truncate">{alert.description}</TableCell>
      <TableCell>
        <Badge className={severityColors[alert.severity]}>
          {alert.severity === 'low' ? 'Baixa' : alert.severity === 'medium' ? 'Média' : 'Alta'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </TableCell>
      <TableCell>
        {alert.is_resolved ? (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolvido
          </Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600">
            Pendente
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {!alert.is_resolved && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResolve(alert.id)}
            disabled={isResolving}
          >
            Resolver
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function LogRow({ log }: { log: EmailAuditLog }) {
  const targetEmail = log.direction === 'sent' ? log.recipient_email : log.sender_email;

  return (
    <TableRow>
      <TableCell>
        {log.direction === 'sent' ? (
          <Badge variant="outline" className="gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Enviado
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <ArrowDownLeft className="h-3 w-3" />
            Recebido
          </Badge>
        )}
      </TableCell>
      <TableCell className="font-medium">{log.user_email}</TableCell>
      <TableCell className="max-w-[200px] truncate">{targetEmail || "-"}</TableCell>
      <TableCell className="max-w-[200px] truncate">{log.subject || "-"}</TableCell>
      <TableCell>
        {log.is_external ? (
          <Badge variant="outline" className="text-orange-600 gap-1">
            <Globe className="h-3 w-3" />
            {log.external_domain}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Interno</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </TableCell>
    </TableRow>
  );
}

export const AuditTab = memo(AuditTabBase);
export default AuditTab;
