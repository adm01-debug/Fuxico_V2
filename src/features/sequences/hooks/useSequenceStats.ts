import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

interface DailyStats {
  date: string;
  enrollments: number;
  replies: number;
}

export function useSequenceStats(days: number = 30) {
  return useQuery({
    queryKey: ['sequence-stats', days],
    queryFn: async (): Promise<DailyStats[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from('sequence_enrollments')
        .select('enrolled_at')
        .eq('user_id', user.id)
        .gte('enrolled_at', startDate.toISOString());

      // Fetch replies from step executions
      const { data: executions } = await supabase
        .from('sequence_step_executions')
        .select('replied_at, enrollment_id')
        .not('replied_at', 'is', null)
        .gte('replied_at', startDate.toISOString());

      // Build daily stats map
      const statsMap = new Map<string, DailyStats>();
      
      // Initialize all days
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        statsMap.set(date, { date, enrollments: 0, replies: 0 });
      }

      // Count enrollments by day
      enrollments?.forEach((e) => {
        const date = format(new Date(e.enrolled_at), 'yyyy-MM-dd');
        const stat = statsMap.get(date);
        if (stat) {
          stat.enrollments++;
        }
      });

      // Count replies by day
      executions?.forEach((e) => {
        if (e.replied_at) {
          const date = format(new Date(e.replied_at), 'yyyy-MM-dd');
          const stat = statsMap.get(date);
          if (stat) {
            stat.replies++;
          }
        }
      });

      return Array.from(statsMap.values());
    },
  });
}
