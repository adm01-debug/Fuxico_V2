// =============================================================================
// FUXICO - Regras de assinatura de documentos (compartilhado pelas edges)
// Arquivo: supabase/functions/_shared/signatures.ts
// Descricao: funcoes puras que decidem o estado de uma solicitacao de assinatura.
// Os CHECKs do banco definem os mesmos valores:
//   signature_requests.status IN (draft, sent, in_progress, completed, cancelled, expired)
//   signature_signers.status  IN (pending, viewed, signed, declined)
// =============================================================================

export type SignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';
export type RequestStatus =
  'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface SignerState {
  status: string;
  order?: number | null;
}

const SIGNABLE: readonly string[] = ['pending', 'viewed'];

export function canSignerSign(
  status: string,
  expiresAt?: string | null,
  now: Date = new Date()
): boolean {
  if (!SIGNABLE.includes(status)) return false;
  return !isExpired(expiresAt, now);
}

export function isExpired(expiresAt?: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const parsed = Date.parse(expiresAt);
  if (Number.isNaN(parsed)) return false;
  return parsed <= now.getTime();
}

/**
 * Calcula o proximo status da solicitacao apos uma assinatura.
 * - expirada tem precedencia sobre qualquer outro estado
 * - todos os signatarios assinados => completed
 * - ao menos um assinado => in_progress
 * - restante => sent (segue aguardando o primeiro signatario)
 */
export function resolveRequestStatus(
  signers: readonly SignerState[],
  expiresAt?: string | null,
  now: Date = new Date()
): RequestStatus {
  if (isExpired(expiresAt, now)) return 'expired';
  if (signers.length > 0 && signers.every((signer) => signer.status === 'signed'))
    return 'completed';
  if (signers.some((signer) => signer.status === 'signed')) return 'in_progress';
  return 'sent';
}

/** Signatarios pendentes em ordem de assinatura (menor order primeiro). */
export function pendingSigners<T extends SignerState>(signers: readonly T[]): T[] {
  return signers
    .filter((signer) => signer.status !== 'signed' && signer.status !== 'declined')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Hash SHA-256 (hex) que identifica a assinatura gravada em document_signatures.hash. */
export async function hashSignature(
  documentId: string,
  signerEmail: string,
  signatureData: string,
  signedAt: string
): Promise<string> {
  const payload = `${documentId}|${signerEmail}|${signatureData}|${signedAt}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
