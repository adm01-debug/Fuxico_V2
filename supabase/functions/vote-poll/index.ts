import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { pollId, optionIds } = await req.json();
    if (!pollId || !optionIds?.length) throw new Error('Poll ID and option IDs required');

    const voterIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check if poll exists and not expired
    const { data: poll } = await supabase.from('polls').select('*').eq('id', pollId).single();
    if (!poll) throw new Error('Poll not found');
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) throw new Error('Poll has expired');

    // Check for duplicate votes from same IP
    const { data: existingVotes } = await supabase.from('poll_votes').select('id').eq('poll_id', pollId).eq('voter_ip', voterIp);
    if (existingVotes?.length) throw new Error('You have already voted');

    // Validate options
    if (!poll.multiple_choice && optionIds.length > 1) throw new Error('Only one option allowed');

    const pollOptions = poll.options as { id: string; text: string; votes: number }[];
    for (const optId of optionIds) {
      if (!pollOptions.find(o => o.id === optId)) throw new Error(`Invalid option: ${optId}`);
    }

    // Record votes
    for (const optionId of optionIds) {
      await supabase.from('poll_votes').insert({ poll_id: pollId, option_id: optionId, voter_ip: voterIp });
    }

    // Update poll options votes
    const updatedOptions = pollOptions.map(opt => ({
      ...opt, votes: optionIds.includes(opt.id) ? opt.votes + 1 : opt.votes
    }));

    await supabase.from('polls').update({ 
      options: updatedOptions, total_votes: poll.total_votes + 1 
    }).eq('id', pollId);

    return new Response(JSON.stringify({ success: true, totalVotes: poll.total_votes + 1, options: updatedOptions }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
