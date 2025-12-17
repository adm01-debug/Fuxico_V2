import { supabase } from "@/integrations/supabase/client";

export interface TrackedEmail {
  id: string;
  tracking_id: string;
  recipient_email: string;
  subject: string | null;
  sender_email: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  opens?: number;
  clicks?: number;
}

export interface TrackingEvent {
  id: string;
  tracking_id: string;
  event_type: 'open' | 'click';
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  link_url: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface TrackedLink {
  id: string;
  tracking_id: string;
  original_url: string;
  link_id: string;
  click_count: number;
  created_at: string;
}

export interface TrackingStats {
  totalOpens: number;
  uniqueOpens: number;
  totalClicks: number;
  uniqueClicks: number;
  firstOpened: string | null;
  lastOpened: string | null;
}

export interface EmailsResponse {
  emails: TrackedEmail[];
  total: number;
}

export interface EmailDetailResponse {
  email: TrackedEmail;
  stats: TrackingStats;
  events: TrackingEvent[];
  links: TrackedLink[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function getTrackedEmails(): Promise<EmailsResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-tracking-stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch tracking data');
  }
  return response.json();
}

export async function getEmailDetail(trackingId: string): Promise<EmailDetailResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-tracking-stats?id=${trackingId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email details');
  }
  return response.json();
}

export interface CreateTrackingRequest {
  recipientEmail: string;
  subject?: string;
  senderEmail?: string;
  links?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateTrackingResponse {
  success: boolean;
  trackingId: string;
  pixelUrl: string;
  pixelHtml: string;
  wrappedLinks: Array<{
    original: string;
    wrapped: string;
    linkId: string;
  }>;
  email: TrackedEmail;
}

export async function createTracking(data: CreateTrackingRequest): Promise<CreateTrackingResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-tracking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create tracking');
  }
  return response.json();
}
