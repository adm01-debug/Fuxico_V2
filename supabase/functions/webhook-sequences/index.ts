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

function jsonResponse(body: unknown, status: number, corsHeaders: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function authenticateRequest(req: Request, secret: string): boolean {
  const headerSecret = req.headers.get('x-webhook-secret');
  const querySecret = new URL(req.url).searchParams.get('secret');
  return (headerSecret || querySecret) === secret;
}

async function logExecution(
  supabase: SupabaseClient,
  userId: string,
  success: boolean,
  payload: object,
  error?: string,
): Promise<void> {
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

async function handleNoEnrollments(
  supabase: SupabaseClient,
  corsHeaders: HeadersInit,
): Promise<Response> {
  const { data: activeSequences } = await supabase
    .from('email_sequences')
    .select('user_id')
    .eq('status', 'active');
  const activeUserIds = [...new Set(activeSequences?.map((s) => s.user_id) || [])];
  for (const userId of activeUserIds) {
    await logExecution(supabase, userId, true, {
      processed: 0,
      errors: 0,
      enrollments_due: 0,
      message: 'Nenhum envio pendente',
    });
  }
  return jsonResponse(
    { success: true, processed: 0, message: 'No enrollments due for processing', timestamp: new Date().toISOString() },
    200,
    corsHeaders,
  );
}

function buildMessage(processed: number, errors: number): string {
  const errPart = errors > 0 ? ` com ${errors} erros` : '';
  return `Processados ${processed} envios${errPart}`;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  try {
    const webhookSecret = Deno.env.get('SEQUENCE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('SEQUENCE_WEBHOOK_SECRET not configured');
      return jsonResponse({ error: 'Webhook not configured' }, 500, corsHeaders);
    }
    if (!authenticateRequest(req, webhookSecret)) {
      console.error('Invalid webhook secret provided');
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: dueEnrollments, error: enrollmentError } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_step_at', new Date().toISOString());

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      throw enrollmentError;
    }

    if (!dueEnrollments || dueEnrollments.length === 0) {
      return handleNoEnrollments(supabase, corsHeaders);
    }

    let processedCount = 0;
    let errorCount = 0;
    const processedByUser: Record<string, { processed: number; errors: number }> = {};

    for (const enrollment of dueEnrollments as SequenceEnrollment[]) {
      processedByUser[enrollment.user_id] ??= { processed: 0, errors: 0 };
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

    for (const [userId, stats] of Object.entries(processedByUser)) {
      await logExecution(supabase, userId, stats.errors === 0, {
        processed: stats.processed,
        errors: stats.errors,
        enrollments_due: dueEnrollments.filter((e) => e.user_id === userId).length,
        message: buildMessage(stats.processed, stats.errors),
      });
    }

    return jsonResponse(
      {
        success: true,
        processed: processedCount,
        errors: errorCount,
        message: `Processed ${processedCount} enrollments with ${errorCount} errors`,
        timestamp: new Date().toISOString(),
      },
      200,
      corsHeaders,
    );

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

// ============================================================================
// Enrollment processing extraído do loop principal para reduzir complexidade
// cognitiva. Retorna 'processed' | 'skipped' | 'completed'.
// ============================================================================
type ProcessOutcome = 'processed' | 'skipped' | 'completed';

async function processEnrollment(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
): Promise<ProcessOutcome> {
  const seq = await fetchActiveSequence(supabase, enrollment.sequence_id);
  if (!seq) return 'skipped';
  if (!isWithinSendWindow(seq.settings)) return 'skipped';

  const nextStepOrder = enrollment.current_step + 1;
  const step = await fetchStep(supabase, enrollment.sequence_id, nextStepOrder);
  if (!step) {
    await markCompleted(supabase, enrollment);
    return 'completed';
  }

  if (await shouldSkipByTrigger(supabase, enrollment, step)) {
    await moveToNextStep(supabase, enrollment, step, enrollment.sequence_id);
    return 'skipped';
  }

  await executeStep(supabase, enrollment, step);
  await moveToNextStep(supabase, enrollment, step, enrollment.sequence_id);
  return 'processed';
}

async function fetchActiveSequence(
  supabase: SupabaseClient,
  sequenceId: string,
): Promise<EmailSequence | null> {
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', sequenceId)
    .single();
  if (error || !data || (data as EmailSequence).status !== 'active') return null;
  return data as EmailSequence;
}

function isWithinSendWindow(settings: EmailSequence['settings']): boolean {
  const now = new Date();
  const hour = now.getHours();
  if (hour < settings.send_hours_start || hour >= settings.send_hours_end) return false;
  const day = now.getDay();
  if (!settings.send_on_weekends && (day === 0 || day === 6)) return false;
  return true;
}

async function fetchStep(
  supabase: SupabaseClient,
  sequenceId: string,
  order: number,
): Promise<SequenceStep | null> {
  const { data, error } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .eq('step_order', order)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return data as SequenceStep;
}

async function markCompleted(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
): Promise<void> {
  await supabase
    .from('sequence_enrollments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', enrollment.id);
  await supabase.rpc('increment_sequence_completed', { seq_id: enrollment.sequence_id });
}

async function shouldSkipByTrigger(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
  step: SequenceStep,
): Promise<boolean> {
  if (enrollment.current_step <= 0) return false;
  const { data } = await supabase
    .from('sequence_step_executions')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!data) return false;
  return evaluateTriggerCondition(step.trigger_condition, data as StepExecution);
}

async function executeStep(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
  step: SequenceStep,
): Promise<void> {
  const subject = replaceVariables(step.subject, enrollment);
  const trackingId = crypto.randomUUID();
  await supabase.from('tracked_emails').insert({
    tracking_id: trackingId,
    user_id: enrollment.user_id,
    recipient_email: enrollment.contact_email,
    subject,
    metadata: {
      sequence_id: enrollment.sequence_id,
      step_id: step.id,
      enrollment_id: enrollment.id,
      step_order: step.step_order,
    },
  });
  await supabase.from('sequence_step_executions').insert({
    enrollment_id: enrollment.id,
    step_id: step.id,
    tracking_id: trackingId,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}
