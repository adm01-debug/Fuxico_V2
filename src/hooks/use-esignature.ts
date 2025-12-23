import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SignatureField {
  id: string;
  type: 'signature' | 'initials' | 'date' | 'text' | 'checkbox';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  signer_email: string;
  label?: string;
}

export interface Signer {
  email: string;
  name: string;
  role: string;
  order: number;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  signed_at?: string;
  ip_address?: string;
}

export interface SignatureRequest {
  id: string;
  document_id: string;
  document_name: string;
  sender_id: string;
  sender_email: string;
  signers: Signer[];
  fields: SignatureField[];
  status: 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  message?: string;
  expires_at?: string;
  created_at: string;
  completed_at?: string;
}

export interface AuditEvent {
  id: string;
  request_id: string;
  event_type: 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'completed' | 'expired' | 'cancelled';
  actor_email: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function useESignature() {
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const { toast } = useToast();

  const loadRequests = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('signature_requests').select('*').or(`sender_id.eq.${user.user.id},signers.cs.[{"email":"${user.user.email}"}]`).order('created_at', { ascending: false });
    if (data) setRequests(data as SignatureRequest[]);
  }, []);

  const createRequest = useCallback(async (
    documentId: string,
    documentName: string,
    signers: Omit<Signer, 'status'>[],
    fields: SignatureField[],
    message?: string,
    expiresInDays?: number
  ): Promise<SignatureRequest> => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined;

      const request: Partial<SignatureRequest> = {
        id: crypto.randomUUID(),
        document_id: documentId,
        document_name: documentName,
        sender_id: user.user.id,
        sender_email: user.user.email!,
        signers: signers.map(s => ({ ...s, status: 'pending' as const })),
        fields,
        status: 'draft',
        message,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('signature_requests').insert(request).select().single();
      if (error) throw error;

      await logAuditEvent(data.id, 'created', user.user.email!, {});
      toast({ title: 'Signature request created' });
      await loadRequests();
      return data as SignatureRequest;
    } finally { setIsLoading(false); }
  }, [loadRequests, toast]);

  const sendRequest = useCallback(async (requestId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { error } = await supabase.functions.invoke('send-signature-request', { body: { requestId } });
      if (error) throw error;

      await supabase.from('signature_requests').update({ status: 'sent', signers: request.signers.map(s => ({ ...s, status: 'sent' })) }).eq('id', requestId);
      
      const { data: user } = await supabase.auth.getUser();
      await logAuditEvent(requestId, 'sent', user.user?.email || '', { recipients: request.signers.map(s => s.email) });
      
      toast({ title: 'Request sent', description: `Sent to ${request.signers.length} signers` });
      await loadRequests();
    } finally { setIsLoading(false); }
  }, [requests, loadRequests, toast]);

  const signDocument = useCallback(async (
    requestId: string,
    signerEmail: string,
    signatureData: Record<string, any>
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const updatedSigners = request.signers.map(s => 
        s.email === signerEmail ? { ...s, status: 'signed' as const, signed_at: new Date().toISOString() } : s
      );

      const allSigned = updatedSigners.every(s => s.status === 'signed');
      
      await supabase.from('signature_requests').update({
        signers: updatedSigners,
        status: allSigned ? 'completed' : 'in_progress',
        completed_at: allSigned ? new Date().toISOString() : undefined
      }).eq('id', requestId);

      await supabase.from('signature_data').insert({ request_id: requestId, signer_email: signerEmail, data: signatureData });
      await logAuditEvent(requestId, 'signed', signerEmail, { fields_signed: Object.keys(signatureData).length });

      if (allSigned) {
        await logAuditEvent(requestId, 'completed', 'system', {});
        await supabase.functions.invoke('generate-signed-document', { body: { requestId } });
      }

      toast({ title: 'Document signed' });
      await loadRequests();
    } finally { setIsLoading(false); }
  }, [requests, loadRequests, toast]);

  const declineDocument = useCallback(async (requestId: string, signerEmail: string, reason?: string): Promise<void> => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const updatedSigners = request.signers.map(s => 
      s.email === signerEmail ? { ...s, status: 'declined' as const } : s
    );

    await supabase.from('signature_requests').update({ signers: updatedSigners, status: 'cancelled' }).eq('id', requestId);
    await logAuditEvent(requestId, 'declined', signerEmail, { reason });
    toast({ title: 'Document declined' });
    await loadRequests();
  }, [requests, loadRequests, toast]);

  const getAuditTrail = useCallback(async (requestId: string): Promise<AuditEvent[]> => {
    const { data } = await supabase.from('signature_audit_trail').select('*').eq('request_id', requestId).order('created_at', { ascending: true });
    return data as AuditEvent[] || [];
  }, []);

  const logAuditEvent = async (requestId: string, eventType: AuditEvent['event_type'], actorEmail: string, metadata: Record<string, any>) => {
    await supabase.from('signature_audit_trail').insert({
      request_id: requestId,
      event_type: eventType,
      actor_email: actorEmail,
      ip_address: 'auto',
      user_agent: navigator.userAgent,
      metadata
    });
  };

  const cancelRequest = useCallback(async (requestId: string): Promise<void> => {
    await supabase.from('signature_requests').update({ status: 'cancelled' }).eq('id', requestId);
    const { data: user } = await supabase.auth.getUser();
    await logAuditEvent(requestId, 'cancelled', user.user?.email || '', {});
    toast({ title: 'Request cancelled' });
    await loadRequests();
  }, [loadRequests, toast]);

  return {
    isLoading, requests,
    loadRequests, createRequest, sendRequest, signDocument, declineDocument, getAuditTrail, cancelRequest
  };
}
