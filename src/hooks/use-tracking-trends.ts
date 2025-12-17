import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DailyTrend {
  date: string;
  label: string;
  opens: number;
  clicks: number;
}

export function useTrackingTrends(days: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tracking-trends', days, user?.id],
    queryFn: async (): Promise<DailyTrend[]> => {
      if (!user) return [];

      const startDate = startOfDay(subDays(new Date(), days - 1));

      // Get user's tracking IDs first
      const { data: emails } = await supabase
        .from('tracked_emails')
        .select('tracking_id')
        .eq('user_id', user.id);

      if (!emails?.length) return generateEmptyDays(days);

      const trackingIds = emails.map(e => e.tracking_id);

      // Fetch events for these tracking IDs
      const { data: events } = await supabase
        .from('tracking_events')
        .select('event_type, created_at')
        .in('tracking_id', trackingIds)
        .gte('created_at', startDate.toISOString());

      // Aggregate by day
      const dailyMap = new Map<string, { opens: number; clicks: number }>();

      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
        dailyMap.set(date, { opens: 0, clicks: 0 });
      }

      // Count events
      events?.forEach(event => {
        const date = format(new Date(event.created_at), 'yyyy-MM-dd');
        const day = dailyMap.get(date);
        if (day) {
          if (event.event_type === 'open') {
            day.opens++;
          } else if (event.event_type === 'click') {
            day.clicks++;
          }
        }
      });

      // Convert to array
      return Array.from(dailyMap.entries()).map(([date, counts]) => ({
        date,
        label: format(new Date(date), 'EEE', { locale: ptBR }),
        opens: counts.opens,
        clicks: counts.clicks,
      }));
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

function generateEmptyDays(days: number): DailyTrend[] {
  const result: DailyTrend[] = [];
  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i);
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE', { locale: ptBR }),
      opens: 0,
      clicks: 0,
    });
  }
  return result;
}
