import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 18. Polls & Surveys
export interface Poll { id: string; question: string; options: { id: string; text: string; votes: number }[]; multiple_choice: boolean; expires_at?: string; total_votes: number; }
export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const { toast } = useToast();
  const loadPolls = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('polls').select('*').eq('user_id', user.user.id);
    if (data) setPolls(data as Poll[]);
  }, []);
  const createPoll = useCallback(async (question: string, options: string[], multipleChoice = false): Promise<Poll> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const pollOptions = options.map(text => ({ id: crypto.randomUUID(), text, votes: 0 }));
    const { data, error } = await supabase.from('polls').insert({ user_id: user.user.id, question, options: pollOptions, multiple_choice: multipleChoice, total_votes: 0 }).select().single();
    if (error) throw error;
    toast({ title: 'Poll created' });
    return data as Poll;
  }, [toast]);
  const vote = useCallback(async (pollId: string, optionIds: string[]): Promise<void> => {
    await supabase.functions.invoke('vote-poll', { body: { pollId, optionIds } });
  }, []);
  const getEmbedCode = useCallback((pollId: string): string => `<iframe src="${window.location.origin}/poll/${pollId}" width="400" height="300" frameborder="0"></iframe>`, []);
  return { polls, loadPolls, createPoll, vote, getEmbedCode };
}

// 19. Team Billing
export interface TeamBilling { id: string; team_name: string; seats: number; used_seats: number; plan: string; billing_email: string; next_billing_date: string; }
export function useTeamBilling() {
  const [billing, setBilling] = useState<TeamBilling | null>(null);
  const loadBilling = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('team_billing').select('*').eq('owner_id', user.user.id).single();
    if (data) setBilling(data as TeamBilling);
  }, []);
  const addSeat = useCallback(async (email: string): Promise<void> => {
    if (!billing) return;
    await supabase.from('team_members').insert({ team_id: billing.id, email, status: 'invited' });
    await supabase.from('team_billing').update({ used_seats: billing.used_seats + 1 }).eq('id', billing.id);
  }, [billing]);
  const removeSeat = useCallback(async (email: string): Promise<void> => {
    if (!billing) return;
    await supabase.from('team_members').delete().eq('team_id', billing.id).eq('email', email);
    await supabase.from('team_billing').update({ used_seats: Math.max(0, billing.used_seats - 1) }).eq('id', billing.id);
  }, [billing]);
  return { billing, loadBilling, addSeat, removeSeat };
}

// 20. Schedule Send
export interface ScheduledEmail { id: string; to: string; subject: string; body: string; scheduled_for: string; status: 'pending' | 'sent' | 'failed'; }
export function useScheduleSend() {
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const { toast } = useToast();
  const loadScheduled = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('scheduled_emails').select('*').eq('user_id', user.user.id).eq('status', 'pending');
    if (data) setScheduled(data as ScheduledEmail[]);
  }, []);
  const scheduleEmail = useCallback(async (to: string, subject: string, body: string, scheduledFor: Date): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('scheduled_emails').insert({ user_id: user.user.id, to, subject, body, scheduled_for: scheduledFor.toISOString(), status: 'pending' });
    toast({ title: 'Email scheduled', description: `Will be sent at ${scheduledFor.toLocaleString()}` });
  }, [toast]);
  const cancelScheduled = useCallback(async (id: string): Promise<void> => {
    await supabase.from('scheduled_emails').delete().eq('id', id);
    await loadScheduled();
  }, [loadScheduled]);
  return { scheduled, loadScheduled, scheduleEmail, cancelScheduled };
}

// 21. Monitor Reply
export interface ReplyMonitor { id: string; email_id: string; recipient: string; sent_at: string; replied: boolean; replied_at?: string; response_time_hours?: number; }
export function useMonitorReply() {
  const [monitors, setMonitors] = useState<ReplyMonitor[]>([]);
  const loadMonitors = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('reply_monitors').select('*').eq('user_id', user.user.id).order('sent_at', { ascending: false });
    if (data) setMonitors(data as ReplyMonitor[]);
  }, []);
  const enableMonitoring = useCallback(async (emailId: string, recipient: string): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('reply_monitors').insert({ user_id: user.user.id, email_id: emailId, recipient, sent_at: new Date().toISOString() });
  }, []);
  const getAvgResponseTime = useCallback(() => {
    const replied = monitors.filter(m => m.replied && m.response_time_hours);
    if (replied.length === 0) return 0;
    return replied.reduce((acc, m) => acc + (m.response_time_hours || 0), 0) / replied.length;
  }, [monitors]);
  return { monitors, loadMonitors, enableMonitoring, getAvgResponseTime };
}

// 22. Incoming Track Indicator
export interface IncomingTracker { id: string; from_email: string; subject: string; detected_pixels: number; detected_at: string; }
export function useIncomingTrackIndicator() {
  const [trackers, setTrackers] = useState<IncomingTracker[]>([]);
  const loadTrackers = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('incoming_trackers').select('*').eq('user_id', user.user.id).order('detected_at', { ascending: false });
    if (data) setTrackers(data as IncomingTracker[]);
  }, []);
  const analyzeEmail = useCallback(async (emailContent: string, fromEmail: string, subject: string): Promise<number> => {
    const pixelPatterns = [/1x1/, /pixel/, /track/, /open.*\.gif/, /beacon/i];
    const detected = pixelPatterns.filter(p => p.test(emailContent)).length;
    if (detected > 0) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) await supabase.from('incoming_trackers').insert({ user_id: user.user.id, from_email: fromEmail, subject, detected_pixels: detected });
    }
    return detected;
  }, []);
  return { trackers, loadTrackers, analyzeEmail };
}

// 23. Activity Dashboard
export interface ActivityItem { id: string; type: 'open' | 'click' | 'bounce' | 'document_view'; email_subject?: string; recipient?: string; link_url?: string; created_at: string; }
export function useActivityDashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({ unopened: 0, clicked: 0, bounced: 0 });
  const loadActivities = useCallback(async (limit = 50) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data: events } = await supabase.from('tracking_events').select('*, tracked_emails(subject, recipient_email)').order('created_at', { ascending: false }).limit(limit);
    if (events) {
      const items: ActivityItem[] = events.map(e => ({ id: e.id, type: e.event_type, email_subject: e.tracked_emails?.subject, recipient: e.tracked_emails?.recipient_email, created_at: e.created_at }));
      setActivities(items);
    }
  }, []);
  const loadStats = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { count: unopened } = await supabase.from('tracked_emails').select('*', { count: 'exact', head: true }).eq('user_id', user.user.id).is('first_opened_at', null);
    const { count: clicked } = await supabase.from('tracking_events').select('*', { count: 'exact', head: true }).eq('event_type', 'click');
    const { count: bounced } = await supabase.from('tracked_emails').select('*', { count: 'exact', head: true }).eq('user_id', user.user.id).eq('delivery_status', 'bounced');
    setStats({ unopened: unopened || 0, clicked: clicked || 0, bounced: bounced || 0 });
  }, []);
  return { activities, stats, loadActivities, loadStats };
}

// 24. Campaign Batch Send
export function useCampaignBatchSend() {
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: 'idle' as 'idle' | 'sending' | 'paused' | 'completed' });
  const sendInBatches = useCallback(async (recipients: string[], subject: string, body: string, batchSize = 50, delayMs = 2000): Promise<void> => {
    setBatchProgress({ current: 0, total: recipients.length, status: 'sending' });
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await supabase.functions.invoke('send-batch-emails', { body: { recipients: batch, subject, body } });
      setBatchProgress(prev => ({ ...prev, current: Math.min(i + batchSize, recipients.length) }));
      if (i + batchSize < recipients.length) await new Promise(r => setTimeout(r, delayMs));
    }
    setBatchProgress(prev => ({ ...prev, status: 'completed' }));
  }, []);
  const pauseBatch = useCallback(() => setBatchProgress(prev => ({ ...prev, status: 'paused' })), []);
  return { batchProgress, sendInBatches, pauseBatch };
}

// 25. Mail Merge Fallback
export function useMailMergeFallback() {
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});
  const setFallback = useCallback((field: string, value: string) => setFallbacks(prev => ({ ...prev, [field]: value })), []);
  const applyFallbacks = useCallback((template: string, data: Record<string, string>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, field) => data[field] || fallbacks[field] || '');
  }, [fallbacks]);
  const saveFallbacks = useCallback(async (): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('user_preferences').upsert({ user_id: user.user.id, mail_merge_fallbacks: fallbacks }, { onConflict: 'user_id' });
  }, [fallbacks]);
  const loadFallbacks = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('user_preferences').select('mail_merge_fallbacks').eq('user_id', user.user.id).single();
    if (data?.mail_merge_fallbacks) setFallbacks(data.mail_merge_fallbacks);
  }, []);
  return { fallbacks, setFallback, applyFallbacks, saveFallbacks, loadFallbacks };
}

// 26. Signature Generator
export interface EmailSignature { id: string; name: string; html: string; is_default: boolean; }
export function useSignatureGenerator() {
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const { toast } = useToast();
  const loadSignatures = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('email_signatures').select('*').eq('user_id', user.user.id);
    if (data) setSignatures(data as EmailSignature[]);
  }, []);
  const generateSignature = useCallback((opts: { name: string; title?: string; company?: string; email?: string; phone?: string; website?: string; logoUrl?: string }): string => {
    return `<table style="font-family:Arial,sans-serif;font-size:14px;color:#333;"><tr><td>${opts.logoUrl ? `<img src="${opts.logoUrl}" width="80" style="margin-right:15px;">` : ''}</td><td><strong>${opts.name}</strong><br/>${opts.title ? `${opts.title}<br/>` : ''}${opts.company ? `${opts.company}<br/>` : ''}${opts.email ? `<a href="mailto:${opts.email}">${opts.email}</a><br/>` : ''}${opts.phone || ''}${opts.website ? ` | <a href="${opts.website}">${opts.website}</a>` : ''}</td></tr></table>`;
  }, []);
  const saveSignature = useCallback(async (name: string, html: string, isDefault = false): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    if (isDefault) await supabase.from('email_signatures').update({ is_default: false }).eq('user_id', user.user.id);
    await supabase.from('email_signatures').insert({ user_id: user.user.id, name, html, is_default: isDefault });
    toast({ title: 'Signature saved' });
    await loadSignatures();
  }, [loadSignatures, toast]);
  const deleteSignature = useCallback(async (id: string): Promise<void> => {
    await supabase.from('email_signatures').delete().eq('id', id);
    await loadSignatures();
  }, [loadSignatures]);
  return { signatures, loadSignatures, generateSignature, saveSignature, deleteSignature };
}

// 27. Email Templates (enhanced)
export interface EmailTemplate { id: string; name: string; subject: string; body: string; category?: string; shared: boolean; uses_count: number; }
export function useEmailTemplatesEnhanced() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const { toast } = useToast();
  const loadTemplates = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('email_templates_v2').select('*').or(`user_id.eq.${user.user.id},shared.eq.true`);
    if (data) setTemplates(data as EmailTemplate[]);
  }, []);
  const createTemplate = useCallback(async (template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('email_templates_v2').insert({ ...template, user_id: user.user.id, uses_count: 0 }).select().single();
    if (error) throw error;
    toast({ title: 'Template saved' });
    await loadTemplates();
    return data as EmailTemplate;
  }, [loadTemplates, toast]);
  const useTemplate = useCallback(async (id: string): Promise<EmailTemplate> => {
    await supabase.rpc('increment_template_uses', { template_id: id });
    const template = templates.find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    return template;
  }, [templates]);
  const shareTemplate = useCallback(async (id: string, shared: boolean): Promise<void> => {
    await supabase.from('email_templates_v2').update({ shared }).eq('id', id);
    await loadTemplates();
  }, [loadTemplates]);
  return { templates, loadTemplates, createTemplate, useTemplate, shareTemplate };
}
