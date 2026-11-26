import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { secureJsonResponse, secureErrorResponse } from "../_shared/security-headers.ts";
import { createLogger } from '../_shared/logger.ts';
import { isWebhookUrlSafe } from '../_shared/url-validator.ts';

const log = createLogger('send-slack-notification');

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
    metadata: z.record(z.string()).optional(),
  }),
});

// Types for notification data
interface NotificationEventData {
  recipientEmail: string;
  subject?: string;
  trackingId?: string;
  linkUrl?: string;
  documentName?: string;
  timestamp?: string;
  metadata?: Record<string, string>;
}

// Slack Block Kit types
interface SlackTextElement {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

interface SlackBlock {
  type: 'header' | 'section' | 'context';
  text?: SlackTextElement;
  fields?: SlackTextElement[];
  elements?: SlackTextElement[];
}

const formatSlackMessage = (eventType: string, data: NotificationEventData): { blocks: SlackBlock[] } => {
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

  const blocks: SlackBlock[] = [
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

// Teams Adaptive Card types
interface TeamsFact {
  name: string;
  value: string;
}

interface TeamsMessageCard {
  '@type': string;
  '@context': string;
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle: string;
    activitySubtitle: string;
    facts: TeamsFact[];
    markdown: boolean;
  }>;
}

const formatTeamsMessage = (eventType: string, data: NotificationEventData): TeamsMessageCard => {
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

  const facts: TeamsFact[] = [
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
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await checkRateLimit(clientIP, "slack-notification", 30, 60);
    if (!rateLimit.allowed) {
      return secureErrorResponse("Rate limit exceeded", 429, corsHeaders);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return secureErrorResponse("Unauthorized", 401, corsHeaders);
    }

    const body = await req.json();
    const validation = NotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return secureErrorResponse({ 
        error: 'Validation failed', 
        details: validation.error.flatten() 
      }, 400, corsHeaders);
    }

    const { webhookUrl, platform, eventType, data } = validation.data;

    // SECURITY: Validate webhook URL to prevent SSRF
    if (!isWebhookUrlSafe(webhookUrl)) {
      return secureErrorResponse("Webhook URL is not allowed (private/internal addresses blocked)", 400, corsHeaders);
    }

    log.info(`Sending ${platform} notification`, { eventType });

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
      log.error(`${platform} webhook error`, { error: errorText });
      return secureErrorResponse({ 
        error: `Failed to send ${platform} notification`,
        details: errorText 
      }, 500, corsHeaders);
    }

    log.info(`${platform} notification sent successfully`);

    return secureJsonResponse({ 
      success: true, 
      platform,
      eventType 
    }, corsHeaders);

  } catch (error) {
    log.error('Error sending notification', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return secureErrorResponse({ error: errorMessage }, 500, corsHeaders);
  }
});
