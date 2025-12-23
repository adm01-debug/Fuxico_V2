import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, isOriginAllowed } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

const ZAPIER_EVENTS = ['email.opened', 'email.clicked', 'email.bounced', 'document.viewed', 'link.clicked'] as const;
type ZapierEvent = typeof ZAPIER_EVENTS[number];

interface ZapierWebhook {
  id: string;
  user_id: string;
  event: ZapierEvent;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitResult = await checkRateLimit(req, 'zapier-webhook', 100);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method === 'POST' && action === 'register') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { event, webhook_url } = await req.json();
      if (!ZAPIER_EVENTS.includes(event)) return new Response(JSON.stringify({ error: 'Invalid event type' }), { status: 400, headers: corsHeaders });

      const { data, error } = await supabaseAdmin.from('zapier_webhooks').upsert({
        user_id: user.id, event, webhook_url, is_active: true, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,event' }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, webhook: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST' && action === 'trigger') {
      const { user_id, event, payload } = await req.json();
      if (!user_id || !event || !payload) return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: corsHeaders });

      const { data: webhooks } = await supabaseAdmin.from('zapier_webhooks').select('*').eq('user_id', user_id).eq('event', event).eq('is_active', true);

      const results = await Promise.allSettled((webhooks || []).map(async (webhook: ZapierWebhook) => {
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload })
        });
        await supabaseAdmin.from('zapier_webhook_logs').insert({
          webhook_id: webhook.id, event, payload, response_status: response.status, success: response.ok
        });
        return { webhook_id: webhook.id, success: response.ok };
      }));

      return new Response(JSON.stringify({ triggered: results.length, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'GET' && action === 'list') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { data } = await supabaseAdmin.from('zapier_webhooks').select('*').eq('user_id', user.id);
      return new Response(JSON.stringify({ webhooks: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'DELETE' && action === 'unregister') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

      const { event } = await req.json();
      await supabaseAdmin.from('zapier_webhooks').delete().eq('user_id', user.id).eq('event', event);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
