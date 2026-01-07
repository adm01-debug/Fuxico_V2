// =============================================================================
// FUXICO - Realtime Metrics Premium Component
// Métricas em tempo real com design premium e animações
// Versão: 2.0 - Premium Design
// =============================================================================

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Activity,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useRealtimeTracking, RealtimeEvent } from '@/hooks/use-realtime-tracking';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// =============================================================================
// ANIMATED COUNTER WITH GLOW EFFECT
// =============================================================================

interface AnimatedCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
}

function AnimatedCounter({ value, label, icon, gradient, glowColor }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setIsAnimating(true);
      
      // Animate number change
      const diff = value - prevValue.current;
      const steps = 10;
      const stepValue = diff / steps;
      let current = prevValue.current;
      
      const interval = setInterval(() => {
        current += stepValue;
        if ((diff > 0 && current >= value) || (diff < 0 && current <= value)) {
          setDisplayValue(value);
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 300);
        } else {
          setDisplayValue(Math.round(current));
        }
      }, 30);
      
      prevValue.current = value;
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative"
    >
      {/* Glow effect on animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className={cn(
              'absolute inset-0 rounded-2xl blur-xl',
              glowColor
            )}
          />
        )}
      </AnimatePresence>

      <div 
        className={cn(
          'relative flex items-center gap-4 p-4 rounded-2xl',
          'border border-border/50 backdrop-blur-sm',
          'transition-all duration-300',
          isAnimating && 'border-primary/50'
        )}
      >
        {/* Icon with gradient background */}
        <motion.div
          animate={{ 
            rotate: isAnimating ? [0, -10, 10, 0] : 0,
            scale: isAnimating ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.4 }}
          className={cn(
            'h-14 w-14 rounded-xl flex items-center justify-center shadow-lg',
            `bg-gradient-to-br ${gradient}`
          )}
        >
          {icon}
        </motion.div>

        {/* Value and label */}
        <div className="flex-1">
          <motion.p
            key={displayValue}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            {displayValue.toLocaleString('pt-BR')}
          </motion.p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>

        {/* Sparkle on increase */}
        <AnimatePresence>
          {isAnimating && value > prevValue.current && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-2 -right-2"
            >
              <div className={cn('p-1 rounded-full', glowColor)}>
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// LIVE EVENT ITEM WITH ANIMATIONS
// =============================================================================

interface LiveEventItemProps {
  event: RealtimeEvent;
  isNew?: boolean;
  index: number;
}

function LiveEventItem({ event, isNew, index }: LiveEventItemProps) {
  const [showHighlight, setShowHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timeout = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const getEventConfig = () => {
    switch (event.type) {
      case 'open':
        return {
          icon: <Eye className="h-4 w-4" />,
          label: 'Abertura',
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-500/30',
        };
      case 'click':
        return {
          icon: <MousePointerClick className="h-4 w-4" />,
          label: 'Clique',
          gradient: 'from-emerald-500 to-teal-500',
          bgColor: 'bg-emerald-500/10',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-500/30',
        };
      case 'bounce':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Bounce',
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-600',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          label: 'Evento',
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-500/30',
        };
    }
  };

  const config = getEventConfig();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-500',
        showHighlight 
          ? `${config.bgColor} ${config.borderColor}` 
          : 'bg-muted/20 border-transparent hover:bg-muted/40'
      )}
    >
      {/* Pulse effect for new events */}
      <AnimatePresence>
        {showHighlight && (
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: 2 }}
            className={cn(
              'absolute inset-0 rounded-xl',
              config.bgColor
            )}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        animate={{ 
          scale: showHighlight ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg',
          `bg-gradient-to-br ${config.gradient}`
        )}
      >
        {config.icon}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.email}</p>
        {event.subject && (
          <p className="text-xs text-muted-foreground truncate">{event.subject}</p>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-col items-end gap-1">
        <Badge 
          variant="outline" 
          className={cn('text-xs px-2', config.borderColor, config.textColor)}
        >
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(event.timestamp), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CONNECTION STATUS INDICATOR
// =============================================================================

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        isConnected 
          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
      )}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Ao Vivo
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Reconectando...
        </>
      )}
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RealtimeMetrics() {
  const { liveStats, liveEvents, isConnected, lastUpdate, resetStats } = useRealtimeTracking();
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  // Mark new events
  useEffect(() => {
    if (liveEvents.length > 0) {
      const latestId = liveEvents[0]?.id;
      if (latestId && !newEventIds.has(latestId)) {
        setNewEventIds((prev) => new Set([...prev, latestId]));
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
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-50 blur-sm pointer-events-none" />

      <CardHeader className="relative pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: isConnected ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center shadow-lg',
                isConnected 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-500'
              )}
            >
              {isConnected ? (
                <Radio className="h-6 w-6 text-white" />
              ) : (
                <WifiOff className="h-6 w-6 text-white" />
              )}
            </motion.div>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Tempo Real
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-0.5">
                <ConnectionStatus isConnected={isConnected} />
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasActivity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetStats} 
                  className="gap-2 rounded-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                  Resetar
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Animated Counters */}
        <div className="grid grid-cols-3 gap-3">
          <AnimatedCounter
            value={liveStats.opens}
            label="Aberturas"
            icon={<Eye className="h-7 w-7 text-white" />}
            gradient="from-blue-500 to-cyan-500"
            glowColor="bg-blue-500/30"
          />
          <AnimatedCounter
            value={liveStats.clicks}
            label="Cliques"
            icon={<MousePointerClick className="h-7 w-7 text-white" />}
            gradient="from-emerald-500 to-teal-500"
            glowColor="bg-emerald-500/30"
          />
          <AnimatedCounter
            value={liveStats.bounces}
            label="Bounces"
            icon={<AlertTriangle className="h-7 w-7 text-white" />}
            gradient="from-red-500 to-rose-500"
            glowColor="bg-red-500/30"
          />
        </div>

        {/* Live Event Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Feed ao Vivo
            </h4>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              <AnimatePresence mode="popLayout">
                {liveEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                    >
                      <Wifi className="h-8 w-8 text-primary" />
                    </motion.div>
                    <p className="text-sm font-medium">Aguardando eventos...</p>
                    <p className="text-xs text-center mt-1">
                      Novas aberturas e cliques aparecerão aqui instantaneamente
                    </p>
                  </motion.div>
                ) : (
                  liveEvents.map((event, index) => (
                    <LiveEventItem 
                      key={event.id} 
                      event={event} 
                      index={index}
                      isNew={index === 0 && newEventIds.has(event.id)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
