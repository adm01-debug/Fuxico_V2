/**
 * AI Insights Edge Function Types
 * @description Types for AI-powered email insights generation
 */

export interface InsightRequest {
  userId: string;
  trackingId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  type: 'engagement' | 'delivery' | 'behavior' | 'all';
}

export interface InsightMetrics {
  openRate: number;
  clickRate: number;
  bounceRate: number;
  avgResponseTime: number;
}

export interface InsightRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

export interface InsightResponse {
  success: boolean;
  data?: {
    metrics: InsightMetrics;
    recommendations: InsightRecommendation[];
    generatedAt: string;
  };
  error?: string;
}

export interface FunctionContext {
  user: { id: string; email: string };
  timestamp: string;
  requestId: string;
}
