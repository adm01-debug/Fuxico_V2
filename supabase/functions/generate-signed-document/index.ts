import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { requestId } = await req.json();
    if (!requestId) throw new Error('Request ID required');

    // Get request and verify all signed
    const { data: request } = await supabase.from('signature_requests').select('*').eq('id', requestId).single();
    if (!request) throw new Error('Request not found');

    const { data: signers } = await supabase.from('signature_data').select('*').eq('request_id', requestId);
    const allSigned = signers?.every(s => s.status === 'signed');
    if (!allSigned) throw new Error('Not all signers have signed');

    // Generate certificate hash
    const signatureData = signers?.map(s => ({ email: s.signer_email, signedAt: s.signed_at, signature: s.signature_image }));
    const certificateHash = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(JSON.stringify({ requestId, signatures: signatureData, timestamp: new Date().toISOString() })));
    const hashHex = Array.from(new Uint8Array(certificateHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create signed document record
    const documentUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/signed-documents/${requestId}.pdf`;
    
    await supabase.from('signed_documents').insert({
      request_id: requestId, document_url: documentUrl, certificate_hash: hashHex,
      signatures: signatureData, created_at: new Date().toISOString()
    });

    await supabase.from('signature_requests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', requestId);
    await supabase.from('signature_audit_trail').insert({
      request_id: requestId, action: 'document_generated', actor_email: 'system',
      details: { certificate_hash: hashHex }, ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return new Response(JSON.stringify({ documentUrl, certificateHash: hashHex }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
