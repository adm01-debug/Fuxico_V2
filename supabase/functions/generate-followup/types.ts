/**
 * Generate Follow-up Types
 * @description Types for AI-powered follow-up email generation
 */

export interface FollowUpRequest {
  trackingId: string;
  userId: string;
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  context?: string;
  previousEmails?: string[];
}

export interface FollowUpSuggestion {
  subject: string;
  body: string;
  tone: string;
  confidence: number;
  reasoning: string;
}

export interface FollowUpResponse {
  success: boolean;
  data?: {
    suggestions: FollowUpSuggestion[];
    originalContext: { recipient: string; subject: string; daysSinceSent: number };
  };
  error?: string;
}
