import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  user_id: string;
  contact_email: string;
  contact_name: string | null;
  current_step: number;
  status: string;
  next_step_at: string;
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  subject: string;
  body: string;
  delay_days: number;
  delay_hours: number;
  trigger_condition: string;
  is_active: boolean;
}

interface EmailSequence {
  id: string;
  user_id: string;
  name: string;
  status: string;
  settings: {
    send_on_weekends: boolean;
    send_hours_start: number;
    send_hours_end: number;
    timezone: string;
  };
}

// Type for step execution record
interface StepExecution {
  id: string;
  enrollment_id: string;
  step_id: string;
  tracking_id: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Type for Supabase client
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST and GET for webhook calls
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('SEQUENCE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('SEQUENCE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get secret from header or query param
    const headerSecret = req.headers.get('x-webhook-secret');
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret');
    const providedSecret = headerSecret || querySecret;

    if (providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Webhook triggered: Processing email sequences...');

    // Helper function to log webhook execution
    async function logWebhookExecution(userId: string, success: boolean, payload: object, error?: string) {
      try {
        await supabase.from('webhook_logs').insert({
          user_id: userId,
          event_type: 'sequence_processing',
          success,
          payload,
          error,
          response_status: success ? 200 : 500,
        });
      } catch (err) {
        console.error('Failed to log webhook execution:', err);
      }
    }

    // Get all enrollments that are due for next step
    const now = new Date().toISOString();
    const { data: dueEnrollments, error: enrollmentError } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_step_at', now);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      throw enrollmentError;
    }

    console.log(`Found ${dueEnrollments?.length || 0} enrollments due for processing`);

    // Get unique user IDs from enrollments for logging
    const _userIds = [...new Set(dueEnrollments?.map(e => e.user_id) || [])];

    if (!dueEnrollments || dueEnrollments.length === 0) {
      // Log for all users who have active sequences
      const { data: activeSequences } = await supabase
        .from('email_sequences')
        .select('user_id')
        .eq('status', 'active');
      
      const activeUserIds = [...new Set(activeSequences?.map(s => s.user_id) || [])];
      for (const userId of activeUserIds) {
        await logWebhookExecution(userId, true, {
          processed: 0,
          errors: 0,
          enrollments_due: 0,
          message: 'Nenhum envio pendente'
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0,
        message: 'No enrollments due for processing',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    let errorCount = 0;
    const processedByUser: Record<string, { processed: number; errors: number }> = {};

    for (const enrollment of dueEnrollments as SequenceEnrollment[]) {
      if (!processedByUser[enrollment.user_id]) {
        processedByUser[enrollment.user_id] = { processed: 0, errors: 0 };
      }
      try {
        const outcome = await processEnrollment(supabase, enrollment);
        if (outcome === 'processed') {
          processedCount++;
          processedByUser[enrollment.user_id].processed++;
        }
      } catch (err) {
        console.error(`Error processing enrollment ${enrollment.id}:`, err);
        errorCount++;
        processedByUser[enrollment.user_id].errors++;
      }
    }

    // Log execution for each user
    for (const [userId, stats] of Object.entries(processedByUser)) {
      await logWebhookExecution(userId, stats.errors === 0, {
        processed: stats.processed,
        errors: stats.errors,
        enrollments_due: dueEnrollments.filter(e => e.user_id === userId).length,
        message: `Processados ${stats.processed} envios${stats.errors > 0 ? ` com ${stats.errors} erros` : ''}`
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount,
      errors: errorCount,
      message: `Processed ${processedCount} enrollments with ${errorCount} errors`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in webhook-sequences:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function evaluateTriggerCondition(condition: string, prevExecution: StepExecution): boolean {
  switch (condition) {
    case 'if_not_opened':
      return !!prevExecution.opened_at;
    case 'if_opened':
      return !prevExecution.opened_at;
    case 'if_not_clicked':
      return !!prevExecution.clicked_at;
    case 'if_clicked':
      return !prevExecution.clicked_at;
    case 'always':
    default:
      return false;
  }
}

function replaceVariables(text: string, enrollment: SequenceEnrollment): string {
  return text
    .replace(/\{\{name\}\}/g, enrollment.contact_name || '')
    .replace(/\{\{email\}\}/g, enrollment.contact_email)
    .replace(/\{\{first_name\}\}/g, enrollment.contact_name?.split(' ')[0] || '');
}

async function moveToNextStep(
  supabase: SupabaseClient, 
  enrollment: SequenceEnrollment, 
  currentStep: SequenceStep, 
  sequenceId: string
): Promise<void> {
  const { data: nextStep } = await supabase
    .from('sequence_steps')
    .select('delay_days, delay_hours')
    .eq('sequence_id', sequenceId)
    .eq('step_order', currentStep.step_order + 1)
    .single();

  let nextStepAt: string | null = null;
  if (nextStep) {
    const next = new Date();
    next.setDate(next.getDate() + (nextStep.delay_days || 0));
    next.setHours(next.getHours() + (nextStep.delay_hours || 0));
    nextStepAt = next.toISOString();
  }

  await supabase
    .from('sequence_enrollments')
    .update({ 
      current_step: currentStep.step_order,
      next_step_at: nextStepAt
    })
    .eq('id', enrollment.id);
}
