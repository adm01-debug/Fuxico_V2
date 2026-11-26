import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  buildSignUrl,
  useCreateSignatureRequest,
  type CreatedSignerLink,
} from '../hooks/use-signatures';

function isValidEmail(value: string): boolean {
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || !domain.includes('.')) return false;
  return !domain.startsWith('.') && !domain.endsWith('.');
}

interface SignerField {
  name: string;
  email: string;
}

interface SignatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: { id: string; fileName: string } | null;
}

const emptySigner = (): SignerField => ({ name: '', email: '' });

export function SignatureRequestDialog({
  open,
  onOpenChange,
  document,
}: SignatureRequestDialogProps) {
  const { toast } = useToast();
  const createRequest = useCreateSignatureRequest();
  const [signers, setSigners] = useState<SignerField[]>([emptySigner()]);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [links, setLinks] = useState<CreatedSignerLink[] | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const resetForm = () => {
    setSigners([emptySigner()]);
    setMessage('');
    setExpiresInDays('7');
    setLinks(null);
    setCopiedToken(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const updateSigner = (index: number, field: keyof SignerField, value: string) => {
    setSigners((current) =>
      current.map((signer, position) =>
        position === index ? { ...signer, [field]: value } : signer
      )
    );
  };

  const addSigner = () => {
    setSigners((current) => (current.length >= 10 ? current : [...current, emptySigner()]));
  };

  const removeSigner = (index: number) => {
    setSigners((current) =>
      current.length === 1 ? current : current.filter((_, position) => position !== index)
    );
  };

  const handleSubmit = () => {
    if (!document) return;

    const filled = signers.filter((signer) => signer.name.trim() && signer.email.trim());
    if (!filled.length) {
      toast({
        variant: 'destructive',
        title: 'Informe ao menos um signatário',
        description: 'Cada signatário precisa de nome e e-mail.',
      });
      return;
    }

    const invalidEmail = filled.find((signer) => !isValidEmail(signer.email.trim()));
    if (invalidEmail) {
      toast({
        variant: 'destructive',
        title: 'E-mail inválido',
        description: 'Revise o e-mail de ' + invalidEmail.name.trim() + '.',
      });
      return;
    }

    const days = Number.parseInt(expiresInDays, 10);
    const expiresAt =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    createRequest.mutate(
      {
        documentId: document.id,
        message: message.trim() || undefined,
        expiresAt,
        signers: filled.map((signer, index) => ({
          name: signer.name.trim(),
          email: signer.email.trim(),
          order: index + 1,
        })),
      },
      {
        onSuccess: (created) => {
          setLinks(created);
          toast({
            title: 'Solicitação criada',
            description: 'Envie o link de assinatura para cada signatário.',
          });
        },
        onError: (error: Error) => {
          toast({
            variant: 'destructive',
            title: 'Falha ao criar solicitação',
            description: error.message,
          });
        },
      }
    );
  };

  const copyLink = async (link: CreatedSignerLink) => {
    const url = link.signUrl ?? (link.token ? buildSignUrl(link.token) : null);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedToken(link.token);
    toast({ title: 'Link copiado!', description: 'Envie para ' + link.email });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar assinatura</DialogTitle>
          <DialogDescription>
            {document ? document.fileName : 'Documento'} ? o signatário recebe um link público e
            assina sem precisar de conta.
          </DialogDescription>
        </DialogHeader>

        {links ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Solicitação criada. Copie o link de cada signatário:
            </p>
            {links.map((link) => (
              <div
                key={link.token ?? link.email}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{link.name ?? link.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{link.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyLink(link)}>
                  {copiedToken === link.token ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Copiar link</span>
                </Button>
              </div>
            ))}
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Concluir</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Signatários</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addSigner}>
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {signers.map((signer, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Nome do signatário"
                      aria-label={'Nome do signatário ' + (index + 1)}
                      value={signer.name}
                      onChange={(event) => updateSigner(index, 'name', event.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      aria-label={'E-mail do signatário ' + (index + 1)}
                      value={signer.email}
                      onChange={(event) => updateSigner(index, 'email', event.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={'Remover signatário ' + (index + 1)}
                    disabled={signers.length === 1}
                    onClick={() => removeSigner(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature-message">Mensagem (opcional)</Label>
              <Textarea
                id="signature-message"
                placeholder="Escreva uma mensagem para os signatários"
                maxLength={1000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature-expires">Validade do convite (dias)</Label>
              <Input
                id="signature-expires"
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createRequest.isPending}>
                {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar solicitação
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SignatureRequestDialog;
