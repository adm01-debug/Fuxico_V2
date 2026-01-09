/**
 * Create Watermarked PDF Types
 * @description Types for PDF watermarking functionality
 */

export interface WatermarkRequest {
  documentId: string;
  userId: string;
  watermarkText?: string;
  watermarkImage?: string;
  position: 'center' | 'diagonal' | 'footer' | 'header';
  opacity: number;
  fontSize?: number;
}

export interface WatermarkResult {
  documentId: string;
  originalUrl: string;
  watermarkedUrl: string;
  watermarkApplied: boolean;
  metadata: {
    pages: number;
    size: number;
    createdAt: string;
  };
}

export interface WatermarkResponse {
  success: boolean;
  data?: WatermarkResult;
  error?: string;
}
