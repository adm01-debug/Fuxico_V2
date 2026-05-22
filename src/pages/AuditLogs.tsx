import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, Shield, Info, Filter } from "lucide-react";

export default function AuditLogs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("event_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredLogs = logs?.filter(log => 
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
      case "critical":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Erro</Badge>;
      case "warning":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 gap-1"><AlertCircle className="w-3 h-3" /> Aviso</Badge>;
      case "info":
        return <Badge variant="secondary" className="gap-1"><Info className="w-3 h-3" /> Info</Badge>;
      case "success":
        return <Badge variant="outline" className="text-green-600 border-green-600 gap-1"><CheckCircle2 className="w-3 h-3" /> Sucesso</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'gmail_auth': 'Autenticação Gmail',
      'oauth_failure': 'Falha OAuth',
      'delivery_error': 'Erro de Entrega',
      'tracking_error': 'Erro de Tracking',
      'security_event': 'Evento de Segurança'
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" /> Auditoria de Segurança
        </h1>
          <p className="text-muted-foreground">
            Acompanhe tentativas de autenticação, erros de sistema e eventos de segurança.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Buscar nos registros</label>
            <Input 
              placeholder="Filtrar por descrição ou tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="w-full md:w-[200px] space-y-2">
            <label className="text-sm font-medium">Tipo de Evento</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="gmail_auth">Autenticação Gmail</SelectItem>
                <SelectItem value="oauth_failure">Falhas OAuth</SelectItem>
                <SelectItem value="delivery_error">Erros de Entrega</SelectItem>
                <SelectItem value="tracking_error">Erros de Tracking</SelectItem>
                <SelectItem value="security_event">Segurança</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Eventos</CardTitle>
            <CardDescription>
              Registros detalhados de atividades críticas na sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">Carregando auditoria...</div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap font-medium">
                          {log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getEventTypeLabel(log.event_type)}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(log.severity || 'info')}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={log.description || ''}>
                          {log.description}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.ip_address || 'Sistema'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum log encontrado</h3>
                <p className="text-muted-foreground">
                  Não existem registros que correspondam aos seus filtros atuais.
                </p>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
