// use-custom-domain.ts - Feature 13/27
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomDomain { id: string; domain: string; verified: boolean; verification_token: string; ssl_enabled: boolean; }

export function useCustomDomain() {
  const [domain, setDomain] = useState<CustomDomain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadDomain = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('custom_domains').select('*').eq('user_id', user.user.id).single();
    if (data) setDomain(data as CustomDomain);
  }, []);

  const addDomain = useCallback(async (domainName: string): Promise<CustomDomain> => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const verificationToken = `fuxico-verify-${crypto.randomUUID().split('-')[0]}`;
      const { data, error } = await supabase.from('custom_domains').insert({ user_id: user.user.id, domain: domainName, verification_token: verificationToken }).select().single();
      if (error) throw error;
      toast({ title: 'Domain added', description: 'Add the DNS TXT record to verify' });
      setDomain(data as CustomDomain);
      return data as CustomDomain;
    } finally { setIsLoading(false); }
  }, [toast]);

  const verifyDomain = useCallback(async (): Promise<boolean> => {
    if (!domain) return false;
    const { data, error } = await supabase.functions.invoke('verify-custom-domain', { body: { domain: domain.domain, token: domain.verification_token } });
    if (error || !data?.verified) { toast({ title: 'Verification failed', variant: 'destructive' }); return false; }
    await supabase.from('custom_domains').update({ verified: true }).eq('id', domain.id);
    toast({ title: 'Domain verified!' });
    await loadDomain();
    return true;
  }, [domain, loadDomain, toast]);

  const getDNSInstructions = useCallback(() => domain ? [
    { type: 'TXT', name: '_fuxico', value: domain.verification_token },
    { type: 'CNAME', name: 'track', value: 'track.fuxico.app' }
  ] : [], [domain]);

  return { domain, isLoading, loadDomain, addDomain, verifyDomain, getDNSInstructions };
}

// use-pdf-secure.ts - Feature 14/27
export interface PDFShareSettings { id: string; document_id: string; allow_download: boolean; require_email: boolean; expires_at?: string; max_views?: number; current_views: number; revoked: boolean; }

export function usePDFSecure() {
  const [settings, setSettings] = useState<PDFShareSettings[]>([]);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('pdf_share_settings').select('*').eq('user_id', user.user.id);
    if (data) setSettings(data as PDFShareSettings[]);
  }, []);

  const createShareSettings = useCallback(async (documentId: string, opts: Partial<PDFShareSettings>): Promise<PDFShareSettings> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('pdf_share_settings').insert({ document_id: documentId, user_id: user.user.id, ...opts }).select().single();
    if (error) throw error;
    toast({ title: 'Share settings created' });
    return data as PDFShareSettings;
  }, [toast]);

  const revokeAccess = useCallback(async (settingsId: string): Promise<void> => {
    await supabase.from('pdf_share_settings').update({ revoked: true }).eq('id', settingsId);
    toast({ title: 'Access revoked' });
    await loadSettings();
  }, [loadSettings, toast]);

  return { settings, loadSettings, createShareSettings, revokeAccess };
}

// use-delivery-certificates.ts - Feature 15/27
export interface DeliveryCertificate { id: string; email_id: string; recipient_email: string; sent_at: string; delivered_at?: string; opened_at?: string; certificate_url?: string; }

export function useDeliveryCertificates() {
  const [certificates, setCertificates] = useState<DeliveryCertificate[]>([]);

  const loadCertificates = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('delivery_certificates').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (data) setCertificates(data as DeliveryCertificate[]);
  }, []);

  const generateCertificate = useCallback(async (emailId: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('generate-delivery-certificate', { body: { emailId } });
    if (error) throw error;
    return data.certificate_url;
  }, []);

  const downloadCertificate = useCallback((certificateUrl: string) => { window.open(certificateUrl, '_blank'); }, []);

  return { certificates, loadCertificates, generateCertificate, downloadCertificate };
}

// use-no-reply-alerts.ts - Feature 16/27
export interface NoReplyAlert { id: string; email_id: string; alert_after_hours: 24 | 48 | 72; triggered: boolean; triggered_at?: string; }

export function useNoReplyAlerts() {
  const [alerts, setAlerts] = useState<NoReplyAlert[]>([]);
  const { toast } = useToast();

  const loadAlerts = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('no_reply_alerts').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (data) setAlerts(data as NoReplyAlert[]);
  }, []);

  const createAlert = useCallback(async (emailId: string, hours: 24 | 48 | 72): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('no_reply_alerts').insert({ user_id: user.user.id, email_id: emailId, alert_after_hours: hours });
    toast({ title: `Alert set for ${hours}h` });
  }, [toast]);

  const cancelAlert = useCallback(async (alertId: string): Promise<void> => {
    await supabase.from('no_reply_alerts').delete().eq('id', alertId);
    await loadAlerts();
  }, [loadAlerts]);

  return { alerts, loadAlerts, createAlert, cancelAlert };
}

// use-hot-conversations.ts - Feature 17/27
export interface ConversationSignal { id: string; email_id: string; signal_type: 'hot' | 'revival' | 'cold'; opens_count: number; last_activity: string; notified: boolean; }

export function useHotConversations() {
  const [signals, setSignals] = useState<ConversationSignal[]>([]);

  const loadSignals = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('conversation_signals').select('*').eq('user_id', user.user.id).order('last_activity', { ascending: false });
    if (data) setSignals(data as ConversationSignal[]);
  }, []);

  const getHotConversations = useCallback(() => signals.filter(s => s.signal_type === 'hot'), [signals]);
  const getRevivals = useCallback(() => signals.filter(s => s.signal_type === 'revival'), [signals]);
  const getColdConversations = useCallback(() => signals.filter(s => s.signal_type === 'cold'), [signals]);

  const markAsNotified = useCallback(async (signalId: string): Promise<void> => {
    await supabase.from('conversation_signals').update({ notified: true }).eq('id', signalId);
  }, []);

  return { signals, loadSignals, getHotConversations, getRevivals, getColdConversations, markAsNotified };
}
