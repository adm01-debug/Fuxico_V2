import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Common schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const URLSchema = z.string().url();

// check-deliverability
export const CheckDeliverabilitySchema = z.object({
  email: EmailSchema,
  domain: z.string().optional(),
});

// create-watermarked-pdf
export const CreateWatermarkedPdfSchema = z.object({
  documentId: UUIDSchema,
  watermarkText: z.string().min(1).max(200),
  opacity: z.number().min(0.1).max(1).default(0.3),
  rotation: z.number().min(-90).max(90).default(-45),
});

// generate-delivery-certificate
export const GenerateDeliveryCertificateSchema = z.object({
  trackingId: z.string().min(1),
});

// generate-signed-document
export const GenerateSignedDocumentSchema = z.object({
  requestId: UUIDSchema,
  signatureData: z.string().optional(),
});

// geo-lookup
export const GeoLookupSchema = z.object({
  ip: z.string().ip().optional(),
  trackingId: z.string().optional(),
});

// get-config
export const GetConfigSchema = z.object({
  key: z.string().optional(),
  userId: UUIDSchema.optional(),
});

// get-tracking-stats
export const GetTrackingStatsSchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
  cursorDate: z.string().datetime().optional(),
});

// send-batch-emails
export const SendBatchEmailsSchema = z.object({
  emails: z.array(z.object({
    to: EmailSchema,
    subject: z.string().min(1).max(500),
    body: z.string().min(1),
    trackingEnabled: z.boolean().default(true),
  })).min(1).max(100),
});

// send-mail-merge
export const SendMailMergeSchema = z.object({
  templateId: UUIDSchema.optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z.array(z.object({
    email: EmailSchema,
    variables: z.record(z.string()).default({}),
  })).min(1).max(500),
});

// send-mass-email
export const SendMassEmailSchema = z.object({
  campaignId: UUIDSchema.optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  recipients: z.array(EmailSchema).min(1),
  scheduledAt: z.string().datetime().optional(),
});

// send-push-notification
export const SendPushNotificationSchema = z.object({
  deviceIds: z.array(UUIDSchema).min(1).max(100).optional(),
  userId: UUIDSchema.optional(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
});

// send-signature-request
export const SendSignatureRequestSchema = z.object({
  documentId: UUIDSchema,
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  signers: z.array(z.object({
    email: EmailSchema,
    name: z.string().min(1).max(100),
    order: z.number().int().min(1).optional(),
  })).min(1).max(10),
  expiresAt: z.string().datetime().optional(),
});

// track-link
export const TrackLinkSchema = z.object({
  linkId: UUIDSchema,
  trackingId: z.string().optional(),
});

// track-pixel
export const TrackPixelSchema = z.object({
  t: z.string().min(1), // trackingId
});

// track-standalone-link
export const TrackStandaloneLinkSchema = z.object({
  linkId: UUIDSchema,
  destinationUrl: URLSchema.optional(),
});

// unsubscribe
export const UnsubscribeSchema = z.object({
  email: EmailSchema,
  trackingId: z.string().optional(),
  reason: z.string().max(500).optional(),
});

// verify-custom-domain
export const VerifyCustomDomainSchema = z.object({
  domain: z.string().min(1).max(255),
  domainId: UUIDSchema.optional(),
});

// vote-poll
export const VotePollSchema = z.object({
  pollId: UUIDSchema,
  selectedOptions: z.array(z.number().int().min(0)).min(1),
  voterEmail: EmailSchema.optional(),
});

// Export all schemas
export const schemas = {
  CheckDeliverabilitySchema,
  CreateWatermarkedPdfSchema,
  GenerateDeliveryCertificateSchema,
  GenerateSignedDocumentSchema,
  GeoLookupSchema,
  GetConfigSchema,
  GetTrackingStatsSchema,
  SendBatchEmailsSchema,
  SendMailMergeSchema,
  SendMassEmailSchema,
  SendPushNotificationSchema,
  SendSignatureRequestSchema,
  TrackLinkSchema,
  TrackPixelSchema,
  TrackStandaloneLinkSchema,
  UnsubscribeSchema,
  VerifyCustomDomainSchema,
  VotePollSchema,
};
