/**
 * Check Deliverability Types
 * @description Types for email deliverability checking
 */

export interface DeliverabilityRequest {
  email: string;
  domain?: string;
  checkType: 'mx' | 'spf' | 'dkim' | 'dmarc' | 'all';
}

export interface DNSRecord {
  type: string;
  value: string;
  valid: boolean;
}

export interface DeliverabilityResult {
  email: string;
  domain: string;
  score: number;
  checks: {
    mx: { valid: boolean; records: DNSRecord[] };
    spf: { valid: boolean; record?: string };
    dkim: { valid: boolean; selector?: string };
    dmarc: { valid: boolean; policy?: string };
  };
  recommendations: string[];
}

export interface DeliverabilityResponse {
  success: boolean;
  data?: DeliverabilityResult;
  error?: string;
}
