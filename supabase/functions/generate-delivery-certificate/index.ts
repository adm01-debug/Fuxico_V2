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

    const { emailId } = await req.json();
    if (!emailId) throw new Error('Email ID required');

    // Get email and events
    const { data: email } = await supabase.from('tracked_emails').select('*').eq('id', emailId).eq('user_id', user.id).single();
    if (!email) throw new Error('Email not found');

    const { data: events } = await supabase.from('tracking_events').select('*').eq('tracking_id', email.tracking_id).order('created_at', { ascending: true });

    const firstOpen = events?.find(e => e.event_type === 'open');
    
    // Generate certificate hash
    const certData = {
      emailId, trackingId: email.tracking_id, recipient: email.recipient_email,
      subject: email.subject, sentAt: email.created_at, openedAt: firstOpen?.created_at,
      generatedAt: new Date().toISOString()
    };
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(certData)));
    const certHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const certId = crypto.randomUUID();
    const certUrl = `${Deno.env.get('PUBLIC_URL') || 'https://fuxico.app'}/certificate/${certId}`;

    // Store certificate
    await supabase.from('delivery_certificates').insert({
      id: certId, email_id: emailId, user_id: user.id, recipient_email: email.recipient_email,
      sent_at: email.created_at, delivered_at: email.created_at, opened_at: firstOpen?.created_at,
      certificate_url: certUrl, certificate_hash: certHash
    });

    return new Response(JSON.stringify({ 
      certificateId: certId, certificateUrl: certUrl, certificateHash: certHash,
      email: { recipient: email.recipient_email, subject: email.subject, sentAt: email.created_at },
      opened: firstOpen ? { at: firstOpen.created_at, ip: firstOpen.ip_address } : null
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
