import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PageView {
  page_number: number;
  time_spent_ms: number;
  entered_at: string;
  exited_at: string;
}

export interface PDFViewSession {
  id: string;
  document_id: string;
  viewer_email?: string;
  viewer_ip: string;
  total_time_ms: number;
  pages_viewed: number;
  total_pages: number;
  completion_percentage: number;
  page_views: PageView[];
  started_at: string;
  ended_at?: string;
}

export interface PDFAnalytics {
  document_id: string;
  document_name: string;
  total_views: number;
  unique_viewers: number;
  avg_time_spent_ms: number;
  avg_completion_percentage: number;
  most_viewed_pages: { page: number; views: number; avg_time_ms: number }[];
  least_viewed_pages: { page: number; views: number; avg_time_ms: number }[];
  view_sessions: PDFViewSession[];
}

export function usePDFAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PDFAnalytics | null>(null);
  const { toast } = useToast();

  const trackPageView = useCallback(async (
    documentId: string,
    sessionId: string,
    pageNumber: number,
    timeSpentMs: number
  ): Promise<void> => {
    try {
      await supabase.from('pdf_page_views').insert({
        document_id: documentId,
        session_id: sessionId,
        page_number: pageNumber,
        time_spent_ms: timeSpentMs
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, []);

  const startViewSession = useCallback(async (
    documentId: string,
    totalPages: number,
    viewerEmail?: string
  ): Promise<string> => {
    const sessionId = crypto.randomUUID();
    
    const { error } = await supabase.from('pdf_view_sessions').insert({
      id: sessionId,
      document_id: documentId,
      viewer_email: viewerEmail,
      total_pages: totalPages,
      pages_viewed: 0,
      total_time_ms: 0,
      completion_percentage: 0
    });

    if (error) throw error;
    return sessionId;
  }, []);

  const endViewSession = useCallback(async (
    sessionId: string,
    pagesViewed: number,
    totalTimeMs: number,
    completionPercentage: number
  ): Promise<void> => {
    await supabase.from('pdf_view_sessions').update({
      pages_viewed: pagesViewed,
      total_time_ms: totalTimeMs,
      completion_percentage: completionPercentage,
      ended_at: new Date().toISOString()
    }).eq('id', sessionId);
  }, []);

  const getDocumentAnalytics = useCallback(async (documentId: string): Promise<PDFAnalytics> => {
    setIsLoading(true);
    try {
      const { data: document } = await supabase.from('tracked_documents').select('name').eq('id', documentId).single();
      const { data: sessions } = await supabase.from('pdf_view_sessions').select('*').eq('document_id', documentId).order('started_at', { ascending: false });
      const { data: pageViews } = await supabase.from('pdf_page_views').select('*').eq('document_id', documentId);

      const uniqueViewers = new Set(sessions?.map(s => s.viewer_email || s.viewer_ip)).size;
      const avgTime = sessions?.reduce((acc, s) => acc + s.total_time_ms, 0) / (sessions?.length || 1);
      const avgCompletion = sessions?.reduce((acc, s) => acc + s.completion_percentage, 0) / (sessions?.length || 1);

      const pageStats: Record<number, { views: number; totalTime: number }> = {};
      pageViews?.forEach(pv => {
        if (!pageStats[pv.page_number]) pageStats[pv.page_number] = { views: 0, totalTime: 0 };
        pageStats[pv.page_number].views++;
        pageStats[pv.page_number].totalTime += pv.time_spent_ms;
      });

      const sortedPages = Object.entries(pageStats)
        .map(([page, stats]) => ({ page: parseInt(page), views: stats.views, avg_time_ms: stats.totalTime / stats.views }))
        .sort((a, b) => b.views - a.views);

      const result: PDFAnalytics = {
        document_id: documentId,
        document_name: document?.name || 'Unknown',
        total_views: sessions?.length || 0,
        unique_viewers: uniqueViewers,
        avg_time_spent_ms: avgTime || 0,
        avg_completion_percentage: avgCompletion || 0,
        most_viewed_pages: sortedPages.slice(0, 5),
        least_viewed_pages: sortedPages.slice(-5).reverse(),
        view_sessions: sessions as PDFViewSession[] || []
      };

      setAnalytics(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHeatmapData = useCallback(async (documentId: string): Promise<{ page: number; intensity: number }[]> => {
    const { data: pageViews } = await supabase.from('pdf_page_views').select('page_number, time_spent_ms').eq('document_id', documentId);
    
    const pageData: Record<number, number> = {};
    pageViews?.forEach(pv => {
      pageData[pv.page_number] = (pageData[pv.page_number] || 0) + pv.time_spent_ms;
    });

    const maxTime = Math.max(...Object.values(pageData), 1);
    return Object.entries(pageData).map(([page, time]) => ({
      page: parseInt(page),
      intensity: time / maxTime
    }));
  }, []);

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return {
    isLoading, analytics,
    trackPageView, startViewSession, endViewSession, getDocumentAnalytics, getHeatmapData, formatTime
  };
}
