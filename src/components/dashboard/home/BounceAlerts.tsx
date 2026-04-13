import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BounceAlert } from './types';

interface BounceAlertsProps {
  alerts: BounceAlert[];
  isLoading?: boolean;
}

export function BounceAlerts({ alerts, isLoading }: BounceAlertsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 xl:p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-600">Nenhum bounce recente</p>
        <p className="text-xs">Seus emails estão sendo entregues corretamente</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2 pr-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 xl:p-4 border border-destructive/20 bg-destructive/5 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.email}</p>
                {alert.subject && (
                  <p className="text-xs text-muted-foreground truncate">{alert.subject}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    {alert.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                {alert.reason && (
                  <p className="text-xs text-destructive/80 mt-1 truncate">{alert.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
