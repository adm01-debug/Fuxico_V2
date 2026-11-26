import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Copy, FileSignature, Loader2, XCircle } from 'lucide-react';
import {
  buildSignUrl,
  SIGNER_STATUS_LABELS,
  SIGNATURE_STATUS_LABELS,
  useCancelSignatureRequest,
  useSignatureRequests,
  type SignatureRequest,
  type SignatureRequestStatus,
  type SignatureSignerStatus,
} from '../hooks/use-signatures';

const REQUEST_BADGE_VARIANT: Record<
  SignatureRequestStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  draft: 'outline',
  sent: 'default',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  expired: 'destructive',
};

const SIGNER_BADGE_VARIANT: Record<
  SignatureSignerStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  pending: 'outline',
  viewed: 'secondary',
  signed: 'default',
  declined: 'destructive',
};

function RequestCard({ request }: { request: SignatureRequest }) {
  const { toast } = useToast();
  const cancelRequest = useCancelSignatureRequest();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const signedCount = request.signers.filter((signer) => signer.status === 'signed').length;
  const canCancel = request.status === 'sent' || request.status === 'in_progress';

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(buildSignUrl(token));
    setCopiedToken(token);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{request.documentName}</p>
            <p className="text-xs text-muted-foreground">
              {signedCount} de {request.signers.length} assinaram ? criada{' '}
              {formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
              {request.expires_at
                ? ' ? expira ' + formatDistanceToNow(new Date(request.expires_at), { locale: ptBR })
                : ''}
            </p>
            {request.message && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.message}</p>
            )}
          </div>
          <Badge variant={REQUEST_BADGE_VARIANT[request.status]}>
            {SIGNATURE_STATUS_LABELS[request.status]}
          </Badge>
        </div>

        <div className="space-y-2">
          {request.signers.map((signer) => (
            <div
              key={signer.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{signer.name ?? signer.email}</p>
                <p className="truncate text-xs text-muted-foreground">{signer.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={SIGNER_BADGE_VARIANT[signer.status]}>
                  {SIGNER_STATUS_LABELS[signer.status]}
                </Badge>
                {signer.status !== 'signed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={'Copiar link de ' + signer.email}
                    onClick={() => copyLink(signer.token)}
                  >
                    {copiedToken === signer.token ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canCancel && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={cancelRequest.isPending}
              onClick={() =>
                cancelRequest.mutate(request.id, {
                  onSuccess: () => toast({ title: 'Solicitação cancelada' }),
                  onError: () =>
                    toast({
                      variant: 'destructive',
                      title: 'Não foi possível cancelar',
                    }),
                })
              }
            >
              {cancelRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Cancelar solicitação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SignatureStatusList({ documentId }: { documentId?: string }) {
  const { data: requests, isLoading } = useSignatureRequests();

  const filtered = documentId
    ? (requests ?? []).filter((request) => request.document_id === documentId)
    : (requests ?? []);

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Carregando assinaturas">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!filtered.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-4 w-4" />
          Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </CardContent>
    </Card>
  );
}

export default SignatureStatusList;
