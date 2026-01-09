/**
 * Generate Delivery Certificate Types
 * @description Types for email delivery certificate generation
 */

export interface CertificateRequest {
  trackingId: string;
  userId: string;
  includeEvents: boolean;
  format: 'pdf' | 'html' | 'json';
}

export interface DeliveryEvent {
  type: 'sent' | 'delivered' | 'opened' | 'clicked';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CertificateData {
  certificateId: string;
  trackingId: string;
  recipient: string;
  subject: string;
  sentAt: string;
  deliveredAt?: string;
  events: DeliveryEvent[];
  hash: string;
  generatedAt: string;
}

export interface CertificateResponse {
  success: boolean;
  data?: {
    certificate: CertificateData;
    downloadUrl: string;
  };
  error?: string;
}
