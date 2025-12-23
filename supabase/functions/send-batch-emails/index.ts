import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');
    
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('Unauthorized');

    const { recipients, subject, body, trackingEnabled = true } = await req.json();
    if (!recipients?.length || !subject || !body) throw new Error('Recipients, subject and body required');

    const results = { sent: 0, failed: 0, trackingIds: [] as string[] };

    for (const email of recipients) {
      try {
        const trackingId = crypto.randomUUID();
        
        if (trackingEnabled) {
          await supabase.from('tracked_emails').insert({
            tracking_id: trackingId, user_id: user.id, recipient_email: email,
            subject, sender_email: user.email, metadata: { batch: true }
          });
          results.trackingIds.push(trackingId);
        }
        
        results.sent++;
      } catch { results.failed++; }
    }

    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
