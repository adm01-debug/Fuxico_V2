import { supabase } from '@/integrations/supabase/client';

export interface TrackedEmail {
  id: string;
  tracking_id: string;
  recipient_email: string;
  subject: string | null;
  sender_email: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  user_id: string | null;
  opens?: number;
  clicks?: number;
  selfOpens?: number;
  delivery_status?: string;
  bounce_type?: string;
  bounce_reason?: string;
  bounce_detected_at?: string;
}

export interface EmailsResponse {
  emails: TrackedEmail[];
  total: number;
}

export interface TrackingTimelineEntry {
  type: string;
  at: string;
  device: string;
  client: string;
  isSelfOpen: boolean;
  linkUrl: string | null;
  country: string | null;
  city: string | null;
}

export interface TrackingDetailSummary {
  opens: number;
  selfOpens: number;
  firstOpenAt: string | null;
  lastOpenAt: string | null;
  clicks: number;
}

export interface TrackingDetailLink {
  linkId: string;
  url: string;
  clicks: number;
}

export interface EmailDetailResponse {
  email: {
    trackingId: string;
    recipientEmail: string;
    subject: string | null;
    createdAt: string;
    deliveryStatus: string | null;
  };
  summary: TrackingDetailSummary;
  links: TrackingDetailLink[];
  timeline: TrackingTimelineEntry[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function getTrackedEmails(): Promise<EmailsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-tracking-stats`, { headers });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch tracking data');
  }
  return response.json();
}

export async function getEmailDetail(trackingId: string): Promise<EmailDetailResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-tracking-detail?trackingId=${encodeURIComponent(trackingId)}`,
    { headers }
  );
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
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
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-tracking`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to create tracking');
  }
  return response.json();
}
