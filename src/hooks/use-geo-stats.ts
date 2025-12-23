import { log } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GeoStat {
  country: string;
  city: string;
  open_count: number;
  click_count: number;
}

export interface CountryStats {
  country: string;
  total: number;
  opens: number;
  clicks: number;
  cities: CityStats[];
}

export interface CityStats {
  city: string;
  opens: number;
  clicks: number;
  total: number;
}

export function useGeoStats() {
  const { user } = useAuth();

  const query = useQuery<CountryStats[]>({
    queryKey: ['geo-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .rpc('get_geo_stats', { p_user_id: user.id });

      if (error) {
        log.error('Error fetching geo stats:', error);
        throw error;
      }

      // Aggregate by country
      const countryMap = new Map<string, CountryStats>();

      (data || []).forEach((row: GeoStat) => {
        const existing = countryMap.get(row.country);
        
        if (existing) {
          existing.opens += row.open_count;
          existing.clicks += row.click_count;
          existing.total += row.open_count + row.click_count;
          existing.cities.push({
            city: row.city,
            opens: row.open_count,
            clicks: row.click_count,
            total: row.open_count + row.click_count,
          });
        } else {
          countryMap.set(row.country, {
            country: row.country,
            opens: row.open_count,
            clicks: row.click_count,
            total: row.open_count + row.click_count,
            cities: [{
              city: row.city,
              opens: row.open_count,
              clicks: row.click_count,
              total: row.open_count + row.click_count,
            }],
          });
        }
      });

      // Sort by total
      return Array.from(countryMap.values())
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
