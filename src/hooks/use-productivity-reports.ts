import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductivityReport {
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  emails_sent: number;
  emails_opened: number;
  open_rate: number;
  links_clicked: number;
  click_rate: number;
  pdfs_viewed: number;
  avg_response_time_hours: number;
  top_recipients: { email: string; opens: number }[];
  best_send_time: { hour: number; open_rate: number };
  messages_by_day: { day: string; count: number }[];
}

export function useProductivityReports() {
  const [report, setReport] = useState<ProductivityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = useCallback(async (period: 'daily' | 'weekly' | 'monthly'): Promise<ProductivityReport> => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const now = new Date();
      let startDate: Date;
      if (period === 'daily') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 1); }
      else if (period === 'weekly') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
      else { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }

      const { data: emails } = await supabase.from('tracked_emails').select('*').eq('user_id', user.user.id).gte('created_at', startDate.toISOString());
      const { data: events } = await supabase.from('tracking_events').select('*').gte('created_at', startDate.toISOString());

      const emailsSent = emails?.length || 0;
      const openedEmails = new Set(events?.filter(e => e.event_type === 'open').map(e => e.tracking_id)).size;
      const clickedLinks = events?.filter(e => e.event_type === 'click').length || 0;

      const recipientOpens: Record<string, number> = {};
      emails?.forEach(email => {
        const opens = events?.filter(e => e.tracking_id === email.tracking_id && e.event_type === 'open').length || 0;
        recipientOpens[email.recipient_email] = (recipientOpens[email.recipient_email] || 0) + opens;
      });

      const hourOpens: Record<number, { opens: number; total: number }> = {};
      events?.filter(e => e.event_type === 'open').forEach(event => {
        const hour = new Date(event.created_at).getHours();
        if (!hourOpens[hour]) hourOpens[hour] = { opens: 0, total: 0 };
        hourOpens[hour].opens++;
      });
      emails?.forEach(email => {
        const hour = new Date(email.created_at).getHours();
        if (!hourOpens[hour]) hourOpens[hour] = { opens: 0, total: 0 };
        hourOpens[hour].total++;
      });

      const bestHour = Object.entries(hourOpens).sort((a, b) => (b[1].opens / b[1].total) - (a[1].opens / a[1].total))[0];

      const dayCount: Record<string, number> = {};
      emails?.forEach(email => {
        const day = new Date(email.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const reportData: ProductivityReport = {
        period, start_date: startDate.toISOString(), end_date: now.toISOString(),
        emails_sent: emailsSent, emails_opened: openedEmails,
        open_rate: emailsSent > 0 ? (openedEmails / emailsSent) * 100 : 0,
        links_clicked: clickedLinks,
        click_rate: openedEmails > 0 ? (clickedLinks / openedEmails) * 100 : 0,
        pdfs_viewed: 0, avg_response_time_hours: 0,
        top_recipients: Object.entries(recipientOpens).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([email, opens]) => ({ email, opens })),
        best_send_time: bestHour ? { hour: parseInt(bestHour[0]), open_rate: (bestHour[1].opens / bestHour[1].total) * 100 } : { hour: 9, open_rate: 0 },
        messages_by_day: Object.entries(dayCount).map(([day, count]) => ({ day, count }))
      };

      setReport(reportData);
      return reportData;
    } finally { setIsLoading(false); }
  }, []);

  const scheduleReport = useCallback(async (period: 'daily' | 'weekly' | 'monthly', email: string): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('scheduled_productivity_reports').upsert({ user_id: user.user.id, period, email, is_active: true }, { onConflict: 'user_id,period' });
  }, []);

  return { report, isLoading, generateReport, scheduleReport };
}
