import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface TrendDataPoint {
  date: string;
  emails: number;
  opens: number;
  clicks: number;
}

interface Prediction {
  date: string;
  predictedEmails: number;
  predictedOpens: number;
  predictedClicks: number;
  confidence: number;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendPredictionData {
  historical: TrendDataPoint[];
  predictions: Prediction[];
  summary: {
    emailsTrend: TrendDirection;
    opensTrend: TrendDirection;
    clicksTrend: TrendDirection;
    predictedOpenRate: number;
    predictedClickRate: number;
  };
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 3) return 'stable';
  const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  if (recent > older * 1.1) return 'up';
  if (recent < older * 0.9) return 'down';
  return 'stable';
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function useTrendPrediction() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trend-prediction', user?.id],
    queryFn: async (): Promise<TrendPredictionData> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Fetch last 30 days of tracking data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: emails } = await supabase
        .from('tracked_emails')
        .select('created_at, delivery_status')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      const { data: events } = await supabase
        .from('tracking_events')
        .select('created_at, event_type, tracking_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at');

      // Group by day
      const dailyData: Record<string, TrendDataPoint> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().split('T')[0];
        dailyData[key] = { date: key, emails: 0, opens: 0, clicks: 0 };
      }

      (emails || []).forEach(e => {
        const key = e.created_at.split('T')[0];
        if (dailyData[key]) dailyData[key].emails++;
      });

      (events || []).forEach(e => {
        const key = e.created_at.split('T')[0];
        if (dailyData[key]) {
          if (e.event_type === 'open') dailyData[key].opens++;
          if (e.event_type === 'click') dailyData[key].clicks++;
        }
      });

      const historical = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

      // Linear regression for predictions
      const emailValues = historical.map(d => d.emails);
      const openValues = historical.map(d => d.opens);
      const clickValues = historical.map(d => d.clicks);

      const emailReg = linearRegression(emailValues);
      const openReg = linearRegression(openValues);
      const clickReg = linearRegression(clickValues);

      const predictions: Prediction[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const idx = historical.length + i;
        predictions.push({
          date: d.toISOString().split('T')[0],
          predictedEmails: Math.max(0, Math.round(emailReg.slope * idx + emailReg.intercept)),
          predictedOpens: Math.max(0, Math.round(openReg.slope * idx + openReg.intercept)),
          predictedClicks: Math.max(0, Math.round(clickReg.slope * idx + clickReg.intercept)),
          confidence: Math.max(50, Math.min(95, 85 - i * 3)),
        });
      }

      const totalPredEmails = predictions.reduce((s, p) => s + p.predictedEmails, 0);
      const totalPredOpens = predictions.reduce((s, p) => s + p.predictedOpens, 0);
      const totalPredClicks = predictions.reduce((s, p) => s + p.predictedClicks, 0);

      return {
        historical,
        predictions,
        summary: {
          emailsTrend: calculateTrend(emailValues),
          opensTrend: calculateTrend(openValues),
          clicksTrend: calculateTrend(clickValues),
          predictedOpenRate: totalPredEmails > 0 ? (totalPredOpens / totalPredEmails) * 100 : 0,
          predictedClickRate: totalPredOpens > 0 ? (totalPredClicks / totalPredOpens) * 100 : 0,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
  });
}
