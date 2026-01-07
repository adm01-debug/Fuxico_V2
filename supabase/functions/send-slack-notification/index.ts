import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NotificationSchema = z.object({
  webhookUrl: z.string().url(),
  platform: z.enum(['slack', 'teams']),
  eventType: z.enum(['open', 'click', 'bounce', 'reply', 'document_view']),
  data: z.object({
    recipientEmail: z.string().email(),
    subject: z.string().optional(),
    trackingId: z.string().optional(),
    linkUrl: z.string().optional(),
    documentName: z.string().optional(),
    timestamp: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const formatSlackMessage = (eventType: string, data: any) => {
  const timestamp = data.timestamp || new Date().toISOString();
  const eventEmojis: Record<string, string> = {
    open: '📬',
    click: '🔗',
    bounce: '⚠️',
    reply: '💬',
    document_view: '📄',
  };

  const eventLabels: Record<string, string> = {
    open: 'Email Opened',
    click: 'Link Clicked',
    bounce: 'Email Bounced',
    reply: 'Reply Received',
    document_view: 'Document Viewed',
  };

  const emoji = eventEmojis[eventType] || '📧';
  const label = eventLabels[eventType] || 'Email Event';

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${label}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Recipient:*\n${data.recipientEmail}`,
        },
        {
          type: 'mrkdwn',
          text: `*Time:*\n${new Date(timestamp).toLocaleString('pt-BR')}`,
        },
      ],
    },
  ];

  if (data.subject) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Subject:* ${data.subject}`,
      },
    });
  }

  if (data.linkUrl && eventType === 'click') {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Link:* <${data.linkUrl}|View Link>`,
      },
    });
  }

  if (data.documentName && eventType === 'document_view') {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Document:* ${data.documentName}`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Tracking ID: \`${data.trackingId || 'N/A'}\` | Sent via FUXICO`,
      },
    ],
  });

  return { blocks };
};

const formatTeamsMessage = (eventType: string, data: any) => {
  const timestamp = data.timestamp || new Date().toISOString();
  const eventLabels: Record<string, string> = {
    open: 'Email Opened',
    click: 'Link Clicked',
    bounce: 'Email Bounced',
    reply: 'Reply Received',
    document_view: 'Document Viewed',
  };

  const eventColors: Record<string, string> = {
    open: '0078D4',
    click: '107C10',
    bounce: 'D83B01',
    reply: '5C2D91',
    document_view: '0078D4',
  };

  const label = eventLabels[eventType] || 'Email Event';
  const color = eventColors[eventType] || '0078D4';

  const facts: any[] = [
    { name: 'Recipient', value: data.recipientEmail },
    { name: 'Time', value: new Date(timestamp).toLocaleString('pt-BR') },
  ];

  if (data.subject) {
    facts.push({ name: 'Subject', value: data.subject });
  }

  if (data.linkUrl && eventType === 'click') {
    facts.push({ name: 'Link', value: data.linkUrl });
  }

  if (data.documentName && eventType === 'document_view') {
    facts.push({ name: 'Document', value: data.documentName });
  }

  facts.push({ name: 'Tracking ID', value: data.trackingId || 'N/A' });

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color,
    summary: `${label}: ${data.recipientEmail}`,
    sections: [
      {
        activityTitle: label,
        activitySubtitle: 'FUXICO Email Tracking',
        facts,
        markdown: true,
      },
    ],
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const validation = NotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validation.error.flatten() 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { webhookUrl, platform, eventType, data } = validation.data;

    console.log(`Sending ${platform} notification for ${eventType} event`);

    const payload = platform === 'slack' 
      ? formatSlackMessage(eventType, data)
      : formatTeamsMessage(eventType, data);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${platform} webhook error:`, errorText);
      return new Response(JSON.stringify({ 
        error: `Failed to send ${platform} notification`,
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`${platform} notification sent successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      platform,
      eventType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
