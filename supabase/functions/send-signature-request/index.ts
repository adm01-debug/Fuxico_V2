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

    const { documentId, signers, message, expiresInDays = 30 } = await req.json();
    if (!documentId || !signers?.length) throw new Error('Document ID and signers required');

    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    const requestId = crypto.randomUUID();

    // Create signature request
    const { data: request, error } = await supabase.from('signature_requests').insert({
      id: requestId, document_id: documentId, user_id: user.id,
      status: 'pending', expires_at: expiresAt.toISOString(), message
    }).select().single();
    if (error) throw error;

    // Create signer records
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const signerToken = crypto.randomUUID();
      
      await supabase.from('signature_data').insert({
        request_id: requestId, signer_email: signer.email, signer_name: signer.name,
        signing_order: signer.order || i + 1, status: 'pending',
        fields: signer.fields || [], access_token: signerToken
      });

      // Log audit trail
      await supabase.from('signature_audit_trail').insert({
        request_id: requestId, action: 'request_sent', actor_email: user.email,
        details: { signer_email: signer.email, signing_order: signer.order || i + 1 },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });
    }

    const signingUrl = `${Deno.env.get('PUBLIC_URL') || 'https://fuxico.app'}/sign/${requestId}`;
    
    return new Response(JSON.stringify({ requestId, signingUrl, expiresAt: expiresAt.toISOString() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
