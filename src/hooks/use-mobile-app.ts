import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MobileDevice {
  id: string;
  device_name: string;
  device_type: 'ios' | 'android';
  push_token?: string;
  last_active: string;
  is_active: boolean;
}

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function useMobileApp() {
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('mobile_devices').select('*').eq('user_id', user.user.id);
    if (data) setDevices(data as MobileDevice[]);
  }, []);

  const registerDevice = useCallback(async (deviceName: string, deviceType: 'ios' | 'android', pushToken?: string): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('mobile_devices').upsert({
      user_id: user.user.id, device_name: deviceName, device_type: deviceType, push_token: pushToken, last_active: new Date().toISOString(), is_active: true
    }, { onConflict: 'user_id,device_name' });
    await loadDevices();
  }, [loadDevices]);

  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> => {
    await supabase.functions.invoke('send-push-notification', { body: { userId, title, body, data } });
  }, []);

  const loadNotifications = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('mobile_notifications').select('*').eq('user_id', user.user.id).order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data as MobileNotification[]);
  }, []);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    await supabase.from('mobile_notifications').update({ read: true }).eq('id', notificationId);
    await loadNotifications();
  }, [loadNotifications]);

  const removeDevice = useCallback(async (deviceId: string): Promise<void> => {
    await supabase.from('mobile_devices').delete().eq('id', deviceId);
    await loadDevices();
  }, [loadDevices]);

  const getMobileDeepLink = useCallback((path: string): { ios: string; android: string } => ({
    ios: `fuxico://${path}`,
    android: `intent://${path}#Intent;scheme=fuxico;package=com.fuxico.app;end`
  }), []);

  const getAppStoreLinks = useCallback(() => ({
    ios: 'https://apps.apple.com/app/fuxico/id000000000',
    android: 'https://play.google.com/store/apps/details?id=com.fuxico.app'
  }), []);

  useEffect(() => { loadDevices(); loadNotifications(); }, [loadDevices, loadNotifications]);

  return { devices, notifications, isLoading, loadDevices, registerDevice, sendPushNotification, loadNotifications, markAsRead, removeDevice, getMobileDeepLink, getAppStoreLinks };
}
