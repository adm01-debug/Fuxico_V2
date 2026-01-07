// =============================================================================
// FUXICO - Componente de Métricas em Tempo Real
// =============================================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  MousePointerClick,
  AlertTriangle,
  Radio,
  RotateCcw,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useRealtimeTracking, RealtimeEvent } from '@/hooks/use-realtime-tracking';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// =============================================================================
// COMPONENTE DE CONTADOR ANIMADO
// =============================================================================

interface AnimatedCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function AnimatedCounter({ value, label, icon, color, bgColor }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [value, displayValue]);

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl transition-all duration-300',
        bgColor,
        isAnimating && 'scale-105 ring-2 ring-offset-2',
        isAnimating && color.includes('blue') && 'ring-blue-400',
        isAnimating && color.includes('green') && 'ring-green-400',
        isAnimating && color.includes('red') && 'ring-red-400',
      )}
    >
      <div className={cn(
        'h-12 w-12 rounded-lg flex items-center justify-center transition-transform',
        isAnimating && 'animate-pulse',
        color.includes('blue') && 'bg-blue-500/20',
        color.includes('green') && 'bg-green-500/20',
        color.includes('red') && 'bg-red-500/20',
      )}>
        {icon}
      </div>
      <div>
        <p className={cn(
          'text-3xl font-bold transition-all',
          isAnimating && 'scale-110',
          color,
        )}>
          {displayValue}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE DE EVENTO LIVE
// =============================================================================

interface LiveEventItemProps {
  event: RealtimeEvent;
  isNew?: boolean;
}

function LiveEventItem({ event, isNew }: LiveEventItemProps) {
  const [showHighlight, setShowHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timeout = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const getEventIcon = () => {
    switch (event.type) {
      case 'open':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'click':
        return <MousePointerClick className="h-4 w-4 text-green-500" />;
      case 'bounce':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case 'open':
        return 'border-blue-500/50 bg-blue-500/5';
      case 'click':
        return 'border-green-500/50 bg-green-500/5';
      case 'bounce':
        return 'border-red-500/50 bg-red-500/5';
    }
  };

  const getEventLabel = () => {
    switch (event.type) {
      case 'open':
        return 'Abertura';
      case 'click':
        return 'Clique';
      case 'bounce':
        return 'Bounce';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all duration-500',
        showHighlight ? getEventColor() : 'bg-muted/30 border-transparent',
        showHighlight && 'animate-pulse',
      )}
    >
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center transition-transform',
        showHighlight && 'scale-110',
        event.type === 'open' && 'bg-blue-500/10',
        event.type === 'click' && 'bg-green-500/10',
        event.type === 'bounce' && 'bg-red-500/10',
      )}>
        {getEventIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.email}</p>
        {event.subject && (
          <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs',
            event.type === 'open' && 'border-blue-500/50 text-blue-600',
            event.type === 'click' && 'border-green-500/50 text-green-600',
            event.type === 'bounce' && 'border-red-500/50 text-red-600',
          )}
        >
          {getEventLabel()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(event.timestamp), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function RealtimeMetrics() {
  const { liveStats, liveEvents, isConnected, lastUpdate, resetStats } = useRealtimeTracking();
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  // Marcar novos eventos
  useEffect(() => {
    if (liveEvents.length > 0) {
      const latestId = liveEvents[0]?.id;
      if (latestId && !newEventIds.has(latestId)) {
        setNewEventIds((prev) => new Set([...prev, latestId]));
        // Remover do set após 3 segundos
        setTimeout(() => {
          setNewEventIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(latestId);
            return newSet;
          });
        }, 3000);
      }
    }
  }, [liveEvents, newEventIds]);

  const hasActivity = liveStats.opens > 0 || liveStats.clicks > 0 || liveStats.bounces > 0;

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-green-500/20' : 'bg-muted',
            )}>
              {isConnected ? (
                <Radio className="h-5 w-5 text-green-500 animate-pulse" />
              ) : (
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Métricas em Tempo Real
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Conectado - Atualizações ao vivo
                  </>
                ) : (
                  'Reconectando...'
                )}
              </CardDescription>
            </div>
          </div>
          {hasActivity && (
            <Button variant="ghost" size="sm" onClick={resetStats} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Resetar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contadores em Tempo Real */}
        <div className="grid grid-cols-3 gap-4">
          <AnimatedCounter
            value={liveStats.opens}
            label="Aberturas"
            icon={<Eye className="h-6 w-6 text-blue-500" />}
            color="text-blue-600"
            bgColor="bg-blue-500/10"
          />
          <AnimatedCounter
            value={liveStats.clicks}
            label="Cliques"
            icon={<MousePointerClick className="h-6 w-6 text-green-500" />}
            color="text-green-600"
            bgColor="bg-green-500/10"
          />
          <AnimatedCounter
            value={liveStats.bounces}
            label="Bounces"
            icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
            color="text-red-600"
            bgColor="bg-red-500/10"
          />
        </div>

        {/* Feed de Eventos ao Vivo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">Feed ao Vivo</h4>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Última atualização: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>
          <ScrollArea className="h-[280px]">
            <div className="space-y-2 pr-4">
              {liveEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Wifi className="h-8 w-8 mb-2 opacity-50 animate-pulse" />
                  <p className="text-sm">Aguardando eventos...</p>
                  <p className="text-xs">Novas aberturas e cliques aparecerão aqui</p>
                </div>
              ) : (
                liveEvents.map((event, index) => (
                  <LiveEventItem 
                    key={event.id} 
                    event={event} 
                    isNew={index === 0 && newEventIds.has(event.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
