import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RegisterWebhookSchema = z.object({
  action: z.literal('register'),
  webhookUrl: z.string().url(),
  events: z.array(z.enum(['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked'])).min(1),
});

const UnregisterWebhookSchema = z.object({
  action: z.literal('unregister'),
  webhookId: z.string().uuid(),
});

const TriggerSchema = z.object({
  action: z.literal('trigger'),
  event: z.string(),
  data: z.record(z.any()),
});

const RequestSchema = z.union([RegisterWebhookSchema, UnregisterWebhookSchema, TriggerSchema]);

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

    const body = await req.json();
    
    // Validate input
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.issues }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const validatedBody = result.data;

    if (validatedBody.action === 'register') {
      const { data, error } = await supabase.from('zapier_webhooks').insert({
        user_id: user.id,
        webhook_url: validatedBody.webhookUrl,
        events: validatedBody.events,
        is_active: true
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (validatedBody.action === 'unregister') {
      await supabase.from('zapier_webhooks').delete().eq('id', validatedBody.webhookId).eq('user_id', user.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (validatedBody.action === 'trigger') {
      const { data: webhooks } = await supabase.from('zapier_webhooks')
        .select('*').eq('user_id', user.id).eq('is_active', true).contains('events', [validatedBody.event]);
      
      const results = [];
      for (const webhook of webhooks || []) {
        try {
          await fetch(webhook.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: validatedBody.event, data: validatedBody.data, timestamp: new Date().toISOString() })
          });
          results.push({ webhookId: webhook.id, success: true });
        } catch (e) {
          results.push({ webhookId: webhook.id, success: false, error: e.message });
        }
      }
      return new Response(JSON.stringify({ triggered: results.length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error('Invalid action');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
