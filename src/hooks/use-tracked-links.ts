import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/use-auth';

export interface TrackedLink {
  id: string;
  link_id: string;
  original_url: string;
  title: string | null;
  description: string | null;
  click_count: number;
  created_at: string;
  last_clicked: string | null;
}

export interface LinkClickEvent {
  id: string;
  link_id: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

export function useTrackedLinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tracked-links", user?.id],
    queryFn: async (): Promise<TrackedLink[]> => {
      if (!user) return [];

      const { data: links, error } = await supabase
        .from("standalone_tracked_links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!links?.length) return [];

      // Get last click for each link
      const linkIds = links.map((l) => l.link_id);
      const { data: events } = await supabase
        .from("link_click_events")
        .select("link_id, created_at")
        .in("link_id", linkIds)
        .order("created_at", { ascending: false });

      const lastClickMap = new Map<string, string>();
      events?.forEach((event) => {
        if (!lastClickMap.has(event.link_id)) {
          lastClickMap.set(event.link_id, event.created_at);
        }
      });

      return links.map((link) => ({
        id: link.id,
        link_id: link.link_id,
        original_url: link.original_url,
        title: link.title,
        description: link.description,
        click_count: link.click_count || 0,
        created_at: link.created_at,
        last_clicked: lastClickMap.get(link.link_id) || null,
      }));
    },
    enabled: !!user,
    refetchInterval: 120000, // Otimizado: 2 min (era 30s),
    gcTime: 1000 * 60 * 30, staleTime: 60000, // Considerar fresco por 1 min
  });
}

export function useLinkClickEvents(linkId: string | null) {
  return useQuery({
    queryKey: ["link-click-events", linkId],
    queryFn: async (): Promise<LinkClickEvent[]> => {
      if (!linkId) return [];

      const { data, error } = await supabase
        .from("link_click_events")
        .select("*")
        .eq("link_id", linkId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!linkId,
  });
}
