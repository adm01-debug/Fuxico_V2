import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse user agent to extract device info
function parseUserAgent(ua: string | null) {
  if (!ua) return { device_type: 'unknown', browser: 'unknown', os: 'unknown' };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device_type = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge';
  else if (/MSIE|Trident/i.test(ua)) browser = 'Internet Explorer';

  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

  return { device_type, browser, os };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const documentId = url.searchParams.get('id');
    const action = url.searchParams.get('action') || 'view'; // 'view' or 'download'

    if (!documentId) {
      return new Response('Document ID required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`[TRACK-DOC] ${action} request for document: ${documentId}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get document info
    const { data: doc, error: docError } = await supabase
      .from('tracked_documents')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (docError || !doc) {
      console.error('[TRACK-DOC] Document not found:', docError);
      return new Response('Document not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Check expiration
    if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
      return new Response('Document link has expired', { 
        status: 410, 
        headers: corsHeaders 
      });
    }

    // Collect tracking data
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer');
    const { device_type, browser, os } = parseUserAgent(userAgent);

    // Get geolocation from Cloudflare headers if available
    const country = req.headers.get('cf-ipcountry') || null;
    const city = req.headers.get('cf-ipcity') || null;

    // Log the tracking event
    const { error: eventError } = await supabase
      .from('document_events')
      .insert({
        document_id: documentId,
        event_type: action,
        ip_address: ip,
        user_agent: userAgent,
        referer,
        country,
        city,
        device_type,
        browser,
        os,
        metadata: {
          timestamp: new Date().toISOString(),
        }
      });

    if (eventError) {
      console.error('[TRACK-DOC] Error logging event:', eventError);
    } else {
      console.log(`[TRACK-DOC] ${action} event logged for ${documentId}`);
    }

    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('tracked-documents')
      .download(doc.file_path);

    if (fileError || !fileData) {
      console.error('[TRACK-DOC] Error downloading file:', fileError);
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Return the PDF
    const headers: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    if (action === 'download') {
      headers['Content-Disposition'] = `attachment; filename="${doc.file_name}"`;
    } else {
      headers['Content-Disposition'] = `inline; filename="${doc.file_name}"`;
    }

    return new Response(fileData, { headers });

  } catch (error) {
    console.error('[TRACK-DOC] Error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
