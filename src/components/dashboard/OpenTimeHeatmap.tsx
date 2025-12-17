import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock } from 'lucide-react';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapData {
  [key: string]: number; // "day-hour" -> count
}

export function OpenTimeHeatmap() {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ['open-time-heatmap', user?.id],
    queryFn: async () => {
      // Get all tracking IDs for the user first
      const { data: emails } = await supabase
        .from('tracked_emails')
        .select('tracking_id')
        .eq('user_id', user!.id);

      if (!emails?.length) return [];

      const trackingIds = emails.map(e => e.tracking_id);

      // Now get all open events for those tracking IDs
      const { data: openEvents, error } = await supabase
        .from('tracking_events')
        .select('created_at, is_self_open')
        .in('tracking_id', trackingIds)
        .eq('event_type', 'open')
        .neq('is_self_open', true);

      if (error) throw error;
      return openEvents || [];
    },
    enabled: !!user?.id,
  });

  const heatmapData = useMemo(() => {
    if (!events?.length) return {};

    const data: HeatmapData = {};
    
    // Initialize all slots with 0
    DAYS.forEach((_, dayIndex) => {
      HOURS.forEach(hour => {
        data[`${dayIndex}-${hour}`] = 0;
      });
    });

    // Count events per slot
    events.forEach(event => {
      const date = new Date(event.created_at);
      const day = date.getDay(); // 0-6 (Sunday-Saturday)
      const hour = date.getHours(); // 0-23
      const key = `${day}-${hour}`;
      data[key] = (data[key] || 0) + 1;
    });

    return data;
  }, [events]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...Object.values(heatmapData));
  }, [heatmapData]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-emerald-500/30';
    if (intensity < 0.5) return 'bg-emerald-500/50';
    if (intensity < 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Abertura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalOpens = Object.values(heatmapData).reduce((a, b) => a + b, 0);

  // Find best time
  const bestTime = useMemo(() => {
    let maxKey = '';
    let maxVal = 0;
    Object.entries(heatmapData).forEach(([key, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxKey = key;
      }
    });
    if (!maxKey) return null;
    const [day, hour] = maxKey.split('-').map(Number);
    return { day: DAYS[day], hour: formatHour(hour), count: maxVal };
  }, [heatmapData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Abertura
        </CardTitle>
        <CardDescription>
          {totalOpens > 0 ? (
            <>
              {totalOpens} aberturas • 
              {bestTime && ` Melhor horário: ${bestTime.day} às ${bestTime.hour}`}
            </>
          ) : (
            'Sem dados de abertura ainda'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hours header */}
            <div className="flex mb-1">
              <div className="w-10" /> {/* Spacer for day labels */}
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-xs text-muted-foreground text-center"
                  style={{ minWidth: '24px' }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center gap-1">
                  <div className="w-10 text-xs text-muted-foreground font-medium">
                    {day}
                  </div>
                  <div className="flex gap-0.5 flex-1">
                    {HOURS.map(hour => {
                      const key = `${dayIndex}-${hour}`;
                      const count = heatmapData[key] || 0;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-6 flex-1 rounded-sm cursor-default transition-colors ${getColor(count)}`}
                              style={{ minWidth: '8px' }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">
                              {day}, {formatHour(hour)} - {formatHour(hour + 1)}
                            </p>
                            <p className="text-muted-foreground">
                              {count} {count === 1 ? 'abertura' : 'aberturas'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-emerald-500/30" />
                <div className="w-4 h-4 rounded-sm bg-emerald-500/50" />
                <div className="w-4 h-4 rounded-sm bg-emerald-500/70" />
                <div className="w-4 h-4 rounded-sm bg-emerald-500" />
              </div>
              <span>Mais</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
