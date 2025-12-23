import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';

const BATCH_SIZE = 50;
const BATCH_DELAY = 1000;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { campaignId, templateId, recipients, subject, body, variables } = await req.json();

    // Validate inputs
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required');
    }
    if (!subject || !body) throw new Error('Subject and body are required');

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      for (const recipient of batch) {
        try {
          // Merge variables into template
          let mergedBody = body;
          let mergedSubject = subject;
          
          if (recipient.variables) {
            for (const [key, value] of Object.entries(recipient.variables)) {
              const regex = new RegExp(`{{${key}}}`, 'g');
              mergedBody = mergedBody.replace(regex, String(value || ''));
              mergedSubject = mergedSubject.replace(regex, String(value || ''));
            }
          }

          // Create tracking
          const trackingId = crypto.randomUUID();
          
          await supabase.from('tracked_emails').insert({
            tracking_id: trackingId,
            user_id: user.id,
            recipient_email: recipient.email,
            subject: mergedSubject,
            sender_email: user.email,
            metadata: { campaign_id: campaignId, template_id: templateId, variables: recipient.variables }
          });

          // Update campaign stats
          if (campaignId) {
            await supabase.from('mail_merge_campaigns').update({
              sent_count: supabase.rpc('increment', { row_id: campaignId, column_name: 'sent_count' })
            }).eq('id', campaignId);
          }

          results.sent++;
        } catch (err) {
          results.failed++;
          results.errors.push(`${recipient.email}: ${err.message}`);
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }

    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
