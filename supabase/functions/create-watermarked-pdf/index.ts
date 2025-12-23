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

    const { documentId, recipientEmail, settings } = await req.json();
    if (!documentId || !recipientEmail) throw new Error('Document ID and recipient email required');

    const defaultSettings = {
      text: `Confidential - ${recipientEmail}`,
      opacity: 0.3, rotation: -45, position: 'diagonal',
      includeDate: true, includeEmail: true, fontSize: 48, color: '#888888'
    };
    const watermarkSettings = { ...defaultSettings, ...settings };
    
    if (watermarkSettings.includeDate) {
      watermarkSettings.text += ` - ${new Date().toLocaleDateString()}`;
    }

    // Create watermarked document record
    const watermarkId = crypto.randomUUID();
    const watermarkedUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/watermarked/${watermarkId}.pdf`;

    const { error } = await supabase.from('watermarked_documents').insert({
      id: watermarkId, original_document_id: documentId, user_id: user.id,
      recipient_email: recipientEmail, watermark_settings: watermarkSettings,
      watermarked_url: watermarkedUrl, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (error) throw error;

    const viewUrl = `${Deno.env.get('PUBLIC_URL') || 'https://fuxico.app'}/view/pdf/${watermarkId}`;

    return new Response(JSON.stringify({ watermarkId, watermarkedUrl, viewUrl, settings: watermarkSettings }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
