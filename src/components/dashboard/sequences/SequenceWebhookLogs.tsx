// =============================================================================
// FUXICO - Sequence Webhook Execution Logs Component
// =============================================================================

import { memo } from 'react';
import { useSequenceWebhookLogs } from '@/hooks/useSequenceWebhookLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function SequenceWebhookLogsBase() {
  const { data: logs, isLoading, refetch, isFetching } = useSequenceWebhookLogs(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Execuções Automáticas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Execuções Automáticas</CardTitle>
              <CardDescription>
                Histórico de processamento automático via webhook
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma execução registrada ainda</p>
            <p className="text-xs mt-1">Configure o webhook no Pipedream, Make ou Zapier</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Processados</TableHead>
                  <TableHead className="w-[80px]">Erros</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.success ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle className="h-3 w-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.payload?.processed !== undefined ? (
                        <Badge variant="secondary" className="font-mono">
                          {log.payload.processed}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.payload?.errors !== undefined && log.payload.errors > 0 ? (
                        <Badge variant="destructive" className="font-mono">
                          {log.payload.errors}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground truncate block">
                        {log.payload?.message || log.error || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span title={format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const SequenceWebhookLogs = memo(SequenceWebhookLogsBase);
