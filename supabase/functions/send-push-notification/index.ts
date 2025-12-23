import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { userId, title, body, data } = await req.json();
    if (!userId || !title || !body) throw new Error('userId, title and body required');

    // Get user's devices
    const { data: devices } = await supabase.from('mobile_devices')
      .select('*').eq('user_id', userId).eq('is_active', true);

    if (!devices?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active devices' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = { sent: 0, failed: 0 };

    for (const device of devices) {
      if (!device.push_token) continue;

      try {
        // Send via FCM or APNs based on device type
        if (device.device_type === 'android') {
          // Firebase Cloud Messaging
          const fcmKey = Deno.env.get('FCM_SERVER_KEY');
          if (fcmKey) {
            await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: { 'Authorization': `key=${fcmKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: device.push_token,
                notification: { title, body },
                data: data || {}
              })
            });
          }
        } else if (device.device_type === 'ios') {
          // Apple Push Notification Service - simplified
          const apnsKey = Deno.env.get('APNS_KEY');
          if (apnsKey) {
            // APNs implementation would go here
          }
        }
        results.sent++;
      } catch { results.failed++; }
    }

    // Store notification record
    await supabase.from('mobile_notifications').insert({
      user_id: userId, title, body, data: data || {}, read: false
    });

    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
