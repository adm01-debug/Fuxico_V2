import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OutlookConnection {
  id: string;
  email: string;
  display_name: string;
  is_connected: boolean;
  last_sync: string;
  settings: { auto_track: boolean; invisible_tracker: boolean; notifications: boolean };
}

export function useOutlook() {
  const [connection, setConnection] = useState<OutlookConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadConnection = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('outlook_connections').select('*').eq('user_id', user.user.id).single();
    if (data) setConnection(data as OutlookConnection);
  }, []);

  const connectOutlook = useCallback(async (): Promise<void> => {
    const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/outlook/callback`;
    const scope = 'openid profile email Mail.Read Mail.Send';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  }, []);

  const disconnectOutlook = useCallback(async (): Promise<void> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    await supabase.from('outlook_connections').delete().eq('user_id', user.user.id);
    setConnection(null);
    toast({ title: 'Outlook disconnected' });
  }, [toast]);

  const updateSettings = useCallback(async (settings: Partial<OutlookConnection['settings']>): Promise<void> => {
    if (!connection) return;
    const newSettings = { ...connection.settings, ...settings };
    await supabase.from('outlook_connections').update({ settings: newSettings }).eq('id', connection.id);
    setConnection({ ...connection, settings: newSettings });
    toast({ title: 'Settings updated' });
  }, [connection, toast]);

  const getAddinManifestUrl = useCallback((): string => `${window.location.origin}/outlook-addin/manifest.xml`, []);

  const getInstallInstructions = useCallback(() => [
    '1. Open Outlook and go to File > Manage Add-ins',
    '2. Click "Add a custom add-in" > "Add from URL"',
    `3. Enter: ${getAddinManifestUrl()}`,
    '4. Click "Install" and accept permissions',
    '5. The FUXICO icon will appear in your email toolbar'
  ], [getAddinManifestUrl]);

  return { connection, isLoading, loadConnection, connectOutlook, disconnectOutlook, updateSettings, getAddinManifestUrl, getInstallInstructions };
}
