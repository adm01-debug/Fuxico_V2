import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { buildPollUrl, useCreatePoll } from '@/features/polls/hooks/use-polls';
import { Check, Copy, Plus, Trash2, Vote } from 'lucide-react';

interface PollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_OPTIONS = 10;

export function PollFormDialog({ open, onOpenChange }: PollFormDialogProps) {
  const { toast } = useToast();
  const createPoll = useCreatePoll();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleVotes(false);
    setExpiresInDays('');
    setCreatedUrl(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((item, position) => (position === index ? value : item)));
  }

  function addOption() {
    setOptions((current) => (current.length >= MAX_OPTIONS ? current : [...current, '']));
  }

  function removeOption(index: number) {
    setOptions((current) =>
      current.length <= 2 ? current : current.filter((_, position) => position !== index)
    );
  }

  function buildExpiresAt(): string | null {
    const days = Number(expiresInDays);
    if (!expiresInDays.trim() || Number.isNaN(days) || days <= 0) return null;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  async function handleSubmit() {
    try {
      const pollId = await createPoll.mutateAsync({
        question,
        options,
        allowMultipleVotes,
        expiresAt: buildExpiresAt(),
      });
      setCreatedUrl(buildPollUrl(pollId));
      toast({ title: 'Enquete criada', description: 'O link público já está pronto para envio.' });
    } catch (error) {
      toast({
        title: 'Não foi possível criar a enquete',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  }

  async function copyLink() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast({ title: 'Link copiado' });
    } catch {
      toast({ title: 'Copie manualmente', description: createdUrl, variant: 'destructive' });
    }
  }

  const labels = options.map((item) => item.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && labels.length >= 2;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            {createdUrl ? 'Enquete publicada' : 'Nova enquete'}
          </DialogTitle>
          <DialogDescription>
            {createdUrl
              ? 'Envie o link abaixo para quem deve votar.'
              : 'Quem receber o link vota sem precisar criar conta.'}
          </DialogDescription>
        </DialogHeader>

        {createdUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="break-all font-mono text-xs">{createdUrl}</p>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={copyLink}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Link copiado' : 'Copiar link de votação'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poll-question">Pergunta</Label>
              <Input
                id="poll-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Qual assunto você quer priorizar no próximo mês?"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Opções</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    maxLength={120}
                    aria-label={`Opção ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    aria-label={`Remover opção ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={options.length >= MAX_OPTIONS}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar opção
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Permitir mais de um voto</p>
                <p className="text-xs text-muted-foreground">
                  Sem isso, cada visitante vota uma única vez.
                </p>
              </div>
              <Switch checked={allowMultipleVotes} onCheckedChange={setAllowMultipleVotes} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-expires">Encerra em (dias)</Label>
              <Input
                id="poll-expires"
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                placeholder="Sem prazo"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {createdUrl ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Concluir
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || createPoll.isPending}
              >
                {createPoll.isPending ? 'Criando...' : 'Criar enquete'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
