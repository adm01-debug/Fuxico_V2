import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrackedDocument {
  id: string;
  document_id: string;
  file_name: string;
  file_size: number | null;
  recipient_name: string | null;
  recipient_email: string | null;
  description: string | null;
  created_at: string;
  expires_at: string | null;
  views: number;
  downloads: number;
  last_viewed: string | null;
}

export interface DocumentEvent {
  id: string;
  document_id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

export function useTrackedDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tracked-documents", user?.id],
    queryFn: async (): Promise<TrackedDocument[]> => {
      if (!user) return [];

      // Get documents
      const { data: docs, error: docsError } = await supabase
        .from("tracked_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      if (!docs?.length) return [];

      // Get event counts for each document
      const documentIds = docs.map((d) => d.document_id);
      const { data: events } = await supabase
        .from("document_events")
        .select("document_id, event_type, created_at")
        .in("document_id", documentIds);

      // Aggregate stats
      const statsMap = new Map<string, { views: number; downloads: number; lastViewed: string | null }>();
      
      events?.forEach((event) => {
        const stats = statsMap.get(event.document_id) || { views: 0, downloads: 0, lastViewed: null };
        
        if (event.event_type === "view") {
          stats.views++;
        } else if (event.event_type === "download") {
          stats.downloads++;
        }
        
        if (!stats.lastViewed || new Date(event.created_at) > new Date(stats.lastViewed)) {
          stats.lastViewed = event.created_at;
        }
        
        statsMap.set(event.document_id, stats);
      });

      return docs.map((doc) => {
        const stats = statsMap.get(doc.document_id) || { views: 0, downloads: 0, lastViewed: null };
        return {
          id: doc.id,
          document_id: doc.document_id,
          file_name: doc.file_name,
          file_size: doc.file_size,
          recipient_name: doc.recipient_name,
          recipient_email: doc.recipient_email,
          description: doc.description,
          created_at: doc.created_at,
          expires_at: doc.expires_at,
          views: stats.views,
          downloads: stats.downloads,
          last_viewed: stats.lastViewed,
        };
      });
    },
    enabled: !!user,
    refetchInterval: 120000, // Otimizado: 2 min (era 30s),
    staleTime: 60000, // Considerar fresco por 1 min
  });
}

export function useDocumentEvents(documentId: string | null) {
  return useQuery({
    queryKey: ["document-events", documentId],
    queryFn: async (): Promise<DocumentEvent[]> => {
      if (!documentId) return [];

      const { data, error } = await supabase
        .from("document_events")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId,
  });
}
