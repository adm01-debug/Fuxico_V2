// =============================================================================
// FUXICO - Edge publica de assinatura de documentos
// Arquivo: supabase/functions/sign-document/index.ts
// Fluxo: o signatario recebe o link /sign/<token>; esta funcao entrega o
// contexto do documento (GET) e grava a assinatura (POST) usando o token como
// credencial, porque o signatario normalmente nao tem conta no sistema.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { secureJsonResponse, secureErrorResponse } from '../_shared/security-headers.ts';
import { createLogger } from '../_shared/logger.ts';
import { publicHandler } from '../_shared/security-middleware.ts';
import {
  canSignerSign,
  hashSignature,
  resolveRequestStatus,
  type SignerState,
} from '../_shared/signatures.ts';

const _log = createLogger('sign-document');

const SignDocumentSchema = z.object({
  token: z.string().uuid(),
  signatureType: z.enum(['draw', 'type', 'upload']).default('type'),
  signatureData: z.string().min(1).max(200000),
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  position: z
    .object({
      page: z.number().int().positive(),
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

interface SignerRow {
  id: string;
  request_id: string;
  email: string;
  name: string | null;
  order: number;
  status: string;
}

interface RequestRow {
  id: string;
  document_id: string;
  user_id: string;
  status: string;
  message: string | null;
  expires_at: string | null;
}

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function loadContext(supabase: ReturnType<typeof serviceClient>, token: string) {
  const { data: signer } = await supabase
    .from('signature_signers')
    .select('id, request_id, email, name, order, status')
    .eq('token', token)
    .maybeSingle<SignerRow>();
  if (!signer) return null;

  const { data: request } = await supabase
    .from('signature_requests')
    .select('id, document_id, user_id, status, message, expires_at')
    .eq('id', signer.request_id)
    .maybeSingle<RequestRow>();
  if (!request) return null;

  const { data: document } = await supabase
    .from('tracked_documents')
    .select('id, document_id, file_name, description, expires_at')
    .eq('id', request.document_id)
    .maybeSingle();

  return { signer, request, document };
}

export const handler = async (req: Request, corsHeaders: Record<string, string>) => {
  try {
    const rateLimit = await checkRateLimit(clientIp(req), 'sign-document', 30, 60);
    if (!rateLimit.allowed) return secureErrorResponse('Rate limit exceeded', 429, corsHeaders);

    const supabase = serviceClient();

    if (req.method === 'GET') {
      const token = new URL(req.url).searchParams.get('token') ?? '';
      if (!z.string().uuid().safeParse(token).success) {
        return secureErrorResponse('Token invalido', 400, corsHeaders);
      }

      const context = await loadContext(supabase, token);
      if (!context)
        return secureErrorResponse('Convite de assinatura nao encontrado', 404, corsHeaders);

      const { signer, request, document } = context;
      if (signer.status === 'pending') {
        await supabase
          .from('signature_signers')
          .update({ status: 'viewed' })
          .eq('id', signer.id)
          .eq('status', 'pending');
      }

      const canSign = canSignerSign(signer.status, request.expires_at);
      return secureJsonResponse(
        {
          success: true,
          document: {
            id: request.document_id,
            fileName: document?.file_name ?? 'Documento',
            description: document?.description ?? null,
          },
          request: {
            status: request.status,
            message: request.message,
            expiresAt: request.expires_at,
          },
          signer: {
            name: signer.name,
            email: signer.email,
            status: signer.status,
            order: signer.order,
          },
          canSign,
        },
        corsHeaders
      );
    }

    if (req.method !== 'POST') {
      return secureErrorResponse('Method not allowed', 405, corsHeaders);
    }

    const validation = SignDocumentSchema.safeParse(await req.json());
    if (!validation.success) {
      return secureErrorResponse({ error: 'Validation failed' }, 400, corsHeaders);
    }
    const { token, signatureType, signatureData, signerName, signerEmail, position } =
      validation.data;

    const context = await loadContext(supabase, token);
    if (!context)
      return secureErrorResponse('Convite de assinatura nao encontrado', 404, corsHeaders);

    const { signer, request } = context;
    if (request.status === 'cancelled') {
      return secureErrorResponse('Solicitacao cancelada', 409, corsHeaders);
    }
    if (!canSignerSign(signer.status, request.expires_at)) {
      return secureErrorResponse(
        signer.status === 'signed'
          ? 'Documento ja assinado por este signatario'
          : 'Convite expirado',
        409,
        corsHeaders
      );
    }
    if (signer.email.toLowerCase() !== signerEmail.toLowerCase()) {
      return secureErrorResponse('E-mail diferente do convite de assinatura', 403, corsHeaders);
    }

    const signedAt = new Date().toISOString();
    const hash = await hashSignature(request.document_id, signer.email, signatureData, signedAt);
    const signatureId = crypto.randomUUID();

    const { error: signatureError } = await supabase.from('document_signatures').insert({
      id: signatureId,
      document_id: request.document_id,
      signature_type: signatureType,
      signature_data: signatureData,
      signer_name: signerName,
      signer_email: signer.email,
      signer_ip: clientIp(req),
      position: position ?? null,
      hash,
      signed_at: signedAt,
    });
    if (signatureError) {
      _log.error('falha ao gravar assinatura', { error: signatureError.message });
      return secureErrorResponse('Falha ao registrar assinatura', 500, corsHeaders);
    }

    const { error: signerError } = await supabase
      .from('signature_signers')
      .update({ status: 'signed', signed_at: signedAt })
      .eq('id', signer.id)
      .in('status', ['pending', 'viewed']);
    if (signerError) {
      _log.error('falha ao atualizar signatario', { error: signerError.message });
      return secureErrorResponse('Falha ao registrar assinatura', 500, corsHeaders);
    }

    const { data: allSigners } = await supabase
      .from('signature_signers')
      .select('status, order')
      .eq('request_id', request.id);
    const requestStatus = resolveRequestStatus(
      (allSigners ?? []) as SignerState[],
      request.expires_at
    );

    await supabase
      .from('signature_requests')
      .update({
        status: requestStatus,
        completed_at: requestStatus === 'completed' ? signedAt : null,
      })
      .eq('id', request.id);

    return secureJsonResponse(
      { success: true, signatureId, hash, requestStatus, signedAt },
      corsHeaders
    );
  } catch (error) {
    _log.error('erro inesperado', {
      error: error instanceof Error ? error.message : String(error),
    });
    return secureErrorResponse('Internal error', 500, corsHeaders);
  }
};

Deno.serve(publicHandler(handler));
