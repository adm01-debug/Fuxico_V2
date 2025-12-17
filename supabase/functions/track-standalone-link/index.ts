import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  let os = 'unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

  return { device_type, browser, os };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const linkId = url.searchParams.get('id');

    if (!linkId) {
      return new Response('Link ID required', { status: 400, headers: corsHeaders });
    }

    console.log(`[TRACK-STANDALONE-LINK] Click for link: ${linkId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get link info
    const { data: link, error: linkError } = await supabase
      .from('standalone_tracked_links')
      .select('*')
      .eq('link_id', linkId)
      .maybeSingle();

    if (linkError || !link) {
      console.error('[TRACK-STANDALONE-LINK] Link not found:', linkError);
      return new Response('Link not found', { status: 404, headers: corsHeaders });
    }

    // Collect tracking data
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer');
    const { device_type, browser, os } = parseUserAgent(userAgent);
    const country = req.headers.get('cf-ipcountry') || null;
    const city = req.headers.get('cf-ipcity') || null;

    // Log click event
    await supabase.from('link_click_events').insert({
      link_id: linkId,
      ip_address: ip,
      user_agent: userAgent,
      referer,
      country,
      city,
      device_type,
      browser,
      os,
    });

    // Increment click count
    await supabase
      .from('standalone_tracked_links')
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq('link_id', linkId);

    console.log(`[TRACK-STANDALONE-LINK] Redirecting to: ${link.original_url}`);

    // Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.original_url,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[TRACK-STANDALONE-LINK] Error:', error);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});
