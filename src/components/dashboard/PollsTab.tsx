import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from './ConfirmDialog';
import { PollFormDialog } from '@/features/polls/components/PollFormDialog';
import {
  POLL_STATUS_LABELS,
  POLL_STATUS_VARIANTS,
  buildPollUrl,
  isPollExpired,
  pollVoteTotal,
  useDeletePoll,
  usePollVotes,
  usePolls,
  useUpdatePollStatus,
  type Poll,
} from '@/features/polls/hooks/use-polls';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, Check, Copy, Link2, Lock, Play, Trash2, Vote } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  onRequestDelete: (poll: Poll) => void;
  onShowVotes: (poll: Poll) => void;
}

function PollCard({ poll, onRequestDelete, onShowVotes }: PollCardProps) {
  const { toast } = useToast();
  const updateStatus = useUpdatePollStatus();
  const [copied, setCopied] = useState(false);

  const total = pollVoteTotal(poll);
  const expired = isPollExpired(poll);
  const canVote = poll.status === 'active' && !expired;

  async function copyLink() {
    const url = buildPollUrl(poll.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copiado', description: url });
    } catch {
      toast({ title: 'Copie manualmente', description: url, variant: 'destructive' });
    }
  }

  async function toggleStatus() {
    try {
      await updateStatus.mutateAsync({
        pollId: poll.id,
        status: poll.status === 'active' ? 'closed' : 'active',
      });
      toast({ title: poll.status === 'active' ? 'Enquete encerrada' : 'Enquete reaberta' });
    } catch (error) {
      toast({
        title: 'Não foi possível alterar o status',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold">{poll.question}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={expired ? 'destructive' : POLL_STATUS_VARIANTS[poll.status]}>
                {expired ? 'Expirada' : POLL_STATUS_LABELS[poll.status]}
              </Badge>
              <span>{total} voto(s)</span>
              <span>·</span>
              <span>
                criada{' '}
                {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true, locale: ptBR })}
              </span>
              {poll.expires_at && (
                <>
                  <span>·</span>
                  <span>
                    encerra{' '}
                    {format(new Date(poll.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </>
              )}
              {poll.allow_multiple_votes && (
                <>
                  <span>·</span>
                  <span>voto múltiplo</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
              disabled={!canVote}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copiar link
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onShowVotes(poll)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Votos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleStatus}
              disabled={updateStatus.isPending}
            >
              {poll.status === 'active' ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {poll.status === 'active' ? 'Encerrar' : 'Reabrir'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRequestDelete(poll)}
              aria-label="Excluir enquete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = total > 0 ? Math.round((option.votes_count / total) * 100) : 0;
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{option.label}</span>
                  <span className="text-muted-foreground">
                    {option.votes_count} · {percentage}%
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
          {poll.options.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta enquete não tem opções cadastradas.
            </p>
          )}
        </div>

        {canVote && (
          <p className="flex items-center gap-2 break-all font-mono text-xs text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0" />
            {buildPollUrl(poll.id)}
          </p>
        )}
        {expired && (
          <p className="text-xs text-muted-foreground">
            O prazo terminou: o link público não aceita mais votos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface VotesDialogProps {
  poll: Poll | null;
  onOpenChange: (open: boolean) => void;
}

function VotesDialog({ poll, onOpenChange }: VotesDialogProps) {
  const { data: votes, isLoading } = usePollVotes(poll?.id ?? null);

  return (
    <Dialog open={!!poll} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Votos recebidos</DialogTitle>
          <DialogDescription>{poll?.question}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isLoading && <Skeleton className="h-16 w-full" />}
          {!isLoading && (votes ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum voto registrado até agora.</p>
          )}
          {(votes ?? []).map((vote) => {
            const option = poll?.options.find((item) => item.id === vote.option_id);
            return (
              <div
                key={vote.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{vote.voter_name || 'Anônimo'}</p>
                  <p className="text-xs text-muted-foreground">
                    {vote.voter_email || 'sem e-mail'}
                  </p>
                </div>
                <div className="text-right">
                  <p>{option ? option.label : 'opção removida'}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(vote.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PollsTabBase() {
  const { toast } = useToast();
  const { data: polls, isLoading, error } = usePolls();
  const deletePoll = useDeletePoll();
  const [formOpen, setFormOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [pollToInspect, setPollToInspect] = useState<Poll | null>(null);

  async function confirmDelete() {
    if (!pollToDelete) return;
    try {
      await deletePoll.mutateAsync(pollToDelete.id);
      toast({
        title: 'Enquete excluída',
        description: 'Os votos vinculados também foram removidos.',
      });
    } catch (deleteError) {
      toast({
        title: 'Não foi possível excluir',
        description: deleteError instanceof Error ? deleteError.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setPollToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        type="analytics"
        title="Não foi possível carregar as enquetes"
        description={error instanceof Error ? error.message : 'Tente novamente em instantes.'}
      />
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <>
        <EmptyState
          type="analytics"
          title="Nenhuma enquete criada"
          description="Crie uma enquete e envie o link para coletar a opinião de quem recebe seus e-mails."
          actionLabel="Criar enquete"
          onAction={() => setFormOpen(true)}
        />
        <PollFormDialog open={formOpen} onOpenChange={setFormOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Vote className="h-5 w-5" />
            Enquetes
          </h2>
          <p className="text-sm text-muted-foreground">
            {polls.length} enquete(s) · quem recebe o link vota sem criar conta
          </p>
        </div>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <Vote className="mr-2 h-4 w-4" />
          Nova enquete
        </Button>
      </div>

      <div className="space-y-4">
        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onRequestDelete={setPollToDelete}
            onShowVotes={setPollToInspect}
          />
        ))}
      </div>

      <PollFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <VotesDialog poll={pollToInspect} onOpenChange={(open) => !open && setPollToInspect(null)} />
      <ConfirmDialog
        open={!!pollToDelete}
        onOpenChange={(open) => !open && setPollToDelete(null)}
        title="Excluir enquete"
        description={`Isso apaga "${pollToDelete?.question ?? ''}" e todos os votos recebidos. Não é possível desfazer.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        variant="danger"
        isLoading={deletePoll.isPending}
      />
    </div>
  );
}

export const PollsTab = memo(PollsTabBase);
export default PollsTab;
