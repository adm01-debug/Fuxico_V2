import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

const MONTHLY_LIMIT = 60000;
const BATCH_SIZE = 100;

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

    const { campaignId, recipients, subject, body, scheduleFor } = await req.json();
    if (!recipients?.length || !subject || !body) throw new Error('Missing required fields');

    // Check monthly limit
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const { count } = await supabase.from('email_campaigns').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', startOfMonth.toISOString());
    
    if ((count || 0) + recipients.length > MONTHLY_LIMIT) {
      throw new Error(`Monthly limit exceeded. Used: ${count}, Requested: ${recipients.length}, Limit: ${MONTHLY_LIMIT}`);
    }

    // Create or update campaign
    let campaign = campaignId;
    if (!campaign) {
      const { data } = await supabase.from('email_campaigns').insert({
        user_id: user.id, name: subject, subject, body, total_recipients: recipients.length,
        status: scheduleFor ? 'scheduled' : 'sending', scheduled_for: scheduleFor
      }).select().single();
      campaign = data.id;
    }

    if (scheduleFor) {
      return new Response(JSON.stringify({ campaignId: campaign, scheduled: true }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = { sent: 0, failed: 0 };
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      for (const email of batch) {
        try {
          const trackingId = crypto.randomUUID();
          await supabase.from('tracked_emails').insert({
            tracking_id: trackingId, user_id: user.id, recipient_email: email,
            subject, sender_email: user.email, metadata: { campaign_id: campaign }
          });
          results.sent++;
        } catch { results.failed++; }
      }
      await new Promise(r => setTimeout(r, 500));
    }

    await supabase.from('email_campaigns').update({ 
      sent_count: results.sent, failed_count: results.failed, status: 'completed' 
    }).eq('id', campaign);

    return new Response(JSON.stringify({ campaignId: campaign, ...results }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
