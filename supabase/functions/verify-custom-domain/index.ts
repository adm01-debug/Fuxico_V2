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

    const { domain, token } = await req.json();
    if (!domain || !token) throw new Error('Domain and token required');

    // Verify DNS TXT record
    let verified = false;
    try {
      const dnsResponse = await fetch(`https://dns.google/resolve?name=_fuxico.${domain}&type=TXT`);
      const dnsData = await dnsResponse.json();
      
      if (dnsData.Answer) {
        for (const answer of dnsData.Answer) {
          const txtValue = answer.data?.replace(/"/g, '');
          if (txtValue === token) { verified = true; break; }
        }
      }
    } catch (dnsError) {
      // Try alternative DNS check
      try {
        const cfResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=_fuxico.${domain}&type=TXT`, 
          { headers: { 'Accept': 'application/dns-json' } });
        const cfData = await cfResponse.json();
        if (cfData.Answer) {
          for (const answer of cfData.Answer) {
            if (answer.data?.includes(token)) { verified = true; break; }
          }
        }
      } catch {}
    }

    if (verified) {
      await supabase.from('custom_domains').update({ verified: true, ssl_enabled: true }).eq('user_id', user.id).eq('domain', domain);
    }

    return new Response(JSON.stringify({ verified, domain, message: verified ? 'Domain verified successfully' : 'TXT record not found' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
