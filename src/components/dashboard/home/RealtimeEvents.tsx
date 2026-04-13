import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, MousePointerClick, AlertTriangle, Mail, FileText, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RealtimeEvent } from './types';

interface RealtimeEventsProps {
  events: RealtimeEvent[];
  isLoading?: boolean;
}

const EVENT_CONFIG = {
  open: { icon: Eye, color: 'text-blue-500', label: 'Abertura' },
  click: { icon: MousePointerClick, color: 'text-green-500', label: 'Clique' },
  bounce: { icon: AlertTriangle, color: 'text-red-500', label: 'Bounce' },
  document_view: { icon: FileText, color: 'text-purple-500', label: 'Documento' },
} as const;

export function RealtimeEvents({ events, isLoading }: RealtimeEventsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 xl:p-4 xl:gap-4 bg-muted/50 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div role="region" aria-label="DashboardHome" className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Zap className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhum evento recente</p>
        <p className="text-xs">Eventos aparecerão aqui em tempo real</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px]">
      <div className="space-y-2 pr-4">
        {events.map((event) => {
          const config = EVENT_CONFIG[event.type] || { icon: Mail, color: '', label: 'Evento' };
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 xl:p-4 xl:gap-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.email}</p>
                {event.subject && (
                  <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
