import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock, Globe, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FraudAlert, EmailAuditLog } from '@/hooks/use-email-audit';

const alertTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  suspicious_hours: { label: 'Horário Suspeito', icon: <Clock className="h-4 w-4" /> },
  external_recipient: { label: 'Destinatário Externo', icon: <Globe className="h-4 w-4" /> },
  volume_anomaly: { label: 'Volume Anormal', icon: <TrendingUp className="h-4 w-4" /> },
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function AlertRow({ alert, onResolve, isResolving }: {
  alert: FraudAlert;
  onResolve: (id: string) => void;
  isResolving: boolean;
}) {
  const alertType = alertTypeLabels[alert.alert_type] || {
    label: alert.alert_type,
    icon: <AlertTriangle className="h-4 w-4" />,
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">{alertType.icon}<span className="text-sm">{alertType.label}</span></div>
      </TableCell>
      <TableCell className="font-medium">{alert.user_email}</TableCell>
      <TableCell className="max-w-[300px] truncate">{alert.description}</TableCell>
      <TableCell>
        <Badge className={severityColors[alert.severity]}>
          {alert.severity === 'low' ? 'Baixa' : alert.severity === 'medium' ? 'Média' : 'Alta'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
      </TableCell>
      <TableCell>
        {alert.is_resolved ? (
          <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Resolvido</Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600">Pendente</Badge>
        )}
      </TableCell>
      <TableCell>
        {!alert.is_resolved && (
          <Button variant="ghost" size="sm" onClick={() => onResolve(alert.id)} disabled={isResolving}>Resolver</Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function LogRow({ log }: { log: EmailAuditLog }) {
  const targetEmail = log.direction === 'sent' ? log.recipient_email : log.sender_email;

  return (
    <TableRow>
      <TableCell>
        {log.direction === 'sent' ? (
          <Badge variant="outline" className="gap-1"><ArrowUpRight className="h-3 w-3" />Enviado</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1"><ArrowDownLeft className="h-3 w-3" />Recebido</Badge>
        )}
      </TableCell>
      <TableCell className="font-medium">{log.user_email}</TableCell>
      <TableCell className="max-w-[200px] truncate">{targetEmail || '-'}</TableCell>
      <TableCell className="max-w-[200px] truncate">{log.subject || '-'}</TableCell>
      <TableCell>
        {log.is_external ? (
          <Badge variant="outline" className="text-orange-600 gap-1"><Globe className="h-3 w-3" />{log.external_domain}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Interno</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
      </TableCell>
    </TableRow>
  );
}
