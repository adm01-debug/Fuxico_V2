import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/use-auth';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface MonthlyTrackingStat {
  month: string;           // YYYY-MM-DD (primeiro dia)
  label: string;           // Ex: "jul/26"
  opens: number;
  clicks: number;
  bounces: number;
  distinctIps: number;
}

interface RpcRow {
  month: string;
  event_type: string;
  event_count: number;
  distinct_ips: number;
}

/**
 * Consome a MV agregada mensal (Onda 37) via RPC get_tracking_monthly_stats (Onda 39).
 * Retorna série temporal por mês com opens/clicks/bounces por usuário.
 */
export function useTrackingMonthlyStats(months: number = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tracking-monthly-stats", months, user?.id],
    queryFn: async (): Promise<MonthlyTrackingStat[]> => {
      if (!user) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_tracking_monthly_stats", {
        _user_id: user.id,
        _months: months,
      });
      if (error) throw error;

      const byMonth = new Map<string, MonthlyTrackingStat>();
      (data as RpcRow[] | null)?.forEach((row) => {
        const key = row.month;
        const bucket =
          byMonth.get(key) ??
          {
            month: key,
            label: format(new Date(key), "MMM/yy", { locale: ptBR }),
            opens: 0,
            clicks: 0,
            bounces: 0,
            distinctIps: 0,
          };
        if (row.event_type === "open") bucket.opens += Number(row.event_count);
        else if (row.event_type === "click") bucket.clicks += Number(row.event_count);
        else if (row.event_type === "bounce") bucket.bounces += Number(row.event_count);
        bucket.distinctIps += Number(row.distinct_ips);
        byMonth.set(key, bucket);
      });

      return Array.from(byMonth.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      );
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}
