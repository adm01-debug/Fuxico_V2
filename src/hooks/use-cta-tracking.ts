import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CTAButton {
  id: string;
  name: string;
  text: string;
  url: string;
  style: { bgColor: string; textColor: string; borderRadius: number; padding: string };
  tracking_id: string;
  clicks: number;
  created_at: string;
}

export function useCTATracking() {
  const [buttons, setButtons] = useState<CTAButton[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadButtons = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('cta_buttons').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false });
    if (data) setButtons(data as CTAButton[]);
  }, []);

  const createButton = useCallback(async (button: Partial<CTAButton>): Promise<CTAButton> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const trackingId = crypto.randomUUID().split('-')[0];
    const { data, error } = await supabase.from('cta_buttons').insert({
      ...button, user_id: user.user.id, tracking_id: trackingId, clicks: 0,
      style: button.style || { bgColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, padding: '12px 24px' }
    }).select().single();
    if (error) throw error;
    toast({ title: 'CTA Button created' });
    await loadButtons();
    return data as CTAButton;
  }, [loadButtons, toast]);

  const getButtonHTML = useCallback((button: CTAButton): string => {
    const trackUrl = `${window.location.origin}/track/cta/${button.tracking_id}`;
    return `<a href="${trackUrl}" style="display:inline-block;background-color:${button.style.bgColor};color:${button.style.textColor};padding:${button.style.padding};border-radius:${button.style.borderRadius}px;text-decoration:none;font-weight:bold;">${button.text}</a>`;
  }, []);

  const trackClick = useCallback(async (trackingId: string): Promise<string> => {
    const { data } = await supabase.from('cta_buttons').select('url').eq('tracking_id', trackingId).single();
    await supabase.from('cta_clicks').insert({ tracking_id: trackingId });
    await supabase.rpc('increment_cta_clicks', { p_tracking_id: trackingId });
    return data?.url || '/';
  }, []);

  const deleteButton = useCallback(async (id: string): Promise<void> => {
    await supabase.from('cta_buttons').delete().eq('id', id);
    toast({ title: 'Button deleted' });
    await loadButtons();
  }, [loadButtons, toast]);

  return { buttons, isLoading, loadButtons, createButton, getButtonHTML, trackClick, deleteButton };
}
