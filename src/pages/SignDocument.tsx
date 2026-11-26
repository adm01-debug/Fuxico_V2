import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, FileText, Loader2, PenLine } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SIGN_DOCUMENT_URL = SUPABASE_URL + '/functions/v1/sign-document';

interface SignContext {
  document: { id: string; fileName: string; description: string | null };
  request: { status: string; message: string | null; expiresAt: string | null };
  signer: { name: string | null; email: string; status: string; order: number };
  canSign: boolean;
}

interface SignResult {
  hash: string;
  signedAt: string;
}

async function callSignDocument(
  method: 'GET' | 'POST',
  token: string,
  body?: unknown
): Promise<SignContext | SignResult> {
  const url =
    method === 'GET'
      ? SIGN_DOCUMENT_URL + '?token=' + encodeURIComponent(token)
      : SIGN_DOCUMENT_URL;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'Não foi possível concluir a operação.';
    throw new Error(message);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta inesperada do servidor.');
  }

  return payload as SignContext | SignResult;
}

function blockedReason(context: SignContext): string | null {
  if (context.signer.status === 'signed') return 'Você já assinou este documento.';
  if (context.request.status === 'cancelled')
    return 'Esta solicitação de assinatura foi cancelada.';
  if (context.request.status === 'completed') return 'Este documento já foi assinado por todos.';
  if (context.request.status === 'expired') return 'O prazo de assinatura expirou.';
  if (!context.canSign) return 'Este convite de assinatura não está mais disponível.';
  return null;
}

export default function SignDocument() {
  const { token = '' } = useParams<{ token: string }>();
  const [context, setContext] = useState<SignContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SignResult | null>(null);

  useEffect(() => {
    let active = true;

    const loadContext = async () => {
      if (!token) {
        setLoadError('Link de assinatura inválido.');
        setLoading(false);
        return;
      }

      try {
        const data = (await callSignDocument('GET', token)) as SignContext;
        if (!active) return;
        setContext(data);
        setSignerName(data.signer.name ?? '');
        setSignerEmail(data.signer.email);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Falha ao carregar o convite.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadContext();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSign = async () => {
    if (!context) return;
    if (!signerName.trim()) {
      setSubmitError('Informe seu nome completo.');
      return;
    }
    if (!agreed) {
      setSubmitError('? necessário concordar com os termos para assinar.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const data = (await callSignDocument('POST', token, {
        token,
        signatureType: 'type',
        signatureData: signerName.trim(),
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
      })) as SignResult;

      setResult(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Falha ao registrar a assinatura.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Convite indisponível
            </CardTitle>
            <CardDescription>
              {loadError ?? 'Convite de assinatura não encontrado.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link to="/">Ir para a página inicial</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const reason = blockedReason(context);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {result ? 'Documento assinado' : 'Assinatura de documento'}
          </CardTitle>
          <CardDescription className="space-y-1">
            <span className="block font-medium text-foreground">{context.document.fileName}</span>
            {context.document.description && (
              <span className="block">{context.document.description}</span>
            )}
            {context.request.expiresAt && !result && (
              <span className="block text-xs">
                Prazo: {new Date(context.request.expiresAt).toLocaleString('pt-BR')}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {context.request.message && !result && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              {context.request.message}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Assinatura registrada com sucesso
              </div>
              <div className="space-y-1 rounded-md border p-3 text-xs text-muted-foreground">
                <p>
                  Assinado por <span className="font-medium text-foreground">{signerName}</span> em{' '}
                  {new Date(result.signedAt).toLocaleString('pt-BR')}
                </p>
                <p className="break-all">
                  Código de verificação: <span className="font-mono">{result.hash}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Guarde o código acima. Ele comprova a autenticidade da sua assinatura.
              </p>
            </div>
          )}
          {!result && reason && (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {reason}
            </div>
          )}
          {!result && !reason && (
            <>
              <div className="space-y-2">
                <Label htmlFor="signer-name">Nome completo</Label>
                <Input
                  id="signer-name"
                  value={signerName}
                  placeholder="Digite seu nome completo"
                  onChange={(event) => setSignerName(event.target.value)}
                />
                <p className="rounded-md border bg-muted/40 px-3 py-2 font-serif text-lg italic">
                  {signerName.trim() || 'Sua assinatura aparece aqui'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signer-email">E-mail do convite</Label>
                <Input id="signer-email" value={signerEmail} readOnly className="bg-muted/40" />
                <p className="text-xs text-muted-foreground">
                  A assinatura ? vinculada a este e-mail. Se estiver errado, peça um novo convite.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="signer-agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                />
                <Label htmlFor="signer-agree" className="text-sm font-normal leading-snug">
                  Li o documento e concordo em assiná-lo eletronicamente.
                </Label>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {submitError}
                </div>
              )}
            </>
          )}
        </CardContent>

        {!result && !reason && (
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Badge variant="outline">
              <PenLine className="mr-1 h-3 w-3" />
              Assinatura eletrônica
            </Badge>
            <Button onClick={handleSign} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assinar documento
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
