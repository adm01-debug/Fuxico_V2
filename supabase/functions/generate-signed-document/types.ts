/**
 * Generate Signed Document Types
 */
export interface SignedDocRequest {
  documentId: string;
  userId: string;
  signatureType: 'digital' | 'electronic' | 'timestamp';
  signerInfo: { name: string; email: string; role?: string };
}

export interface SignedDocResponse {
  success: boolean;
  data?: { documentId: string; signedUrl: string; signature: { hash: string; timestamp: string; valid: boolean } };
  error?: string;
}
