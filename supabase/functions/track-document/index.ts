import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const TrackDocumentSchema = z.object({
  documentId: z.string().uuid(),
  page: z.number().int().positive().optional(),
  timeSpent: z.number().positive().optional(),
  viewerEmail: z.string().email().optional(),
});

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const body = await req.json();
    
    // Validate input
    const result = TrackDocumentSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: result.error.issues }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { documentId, page, timeSpent, viewerEmail } = result.data;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    await supabase.from('document_events').insert({
      document_id: documentId,
      event_type: page ? 'page_view' : 'open',
      page_number: page,
      time_spent_seconds: timeSpent,
      viewer_email: viewerEmail,
      ip_address: ip,
      user_agent: userAgent
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
