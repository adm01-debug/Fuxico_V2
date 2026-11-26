import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart3, CheckCircle2, Vote } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const VOTE_POLL_URL = SUPABASE_URL + '/functions/v1/vote-poll';

interface PollOptionView {
  id: string;
  label: string;
  votesCount: number;
}

interface PollView {
  id: string;
  question: string;
  status: string;
  allowMultipleVotes: boolean;
  expiresAt: string | null;
  totalVotes: number;
  expired: boolean;
  canVote: boolean;
  options: PollOptionView[];
}

function blockedReason(poll: PollView): string | null {
  if (poll.status === 'closed') return 'Esta enquete foi encerrada pelo criador.';
  if (poll.status === 'archived') return 'Esta enquete foi arquivada.';
  if (poll.status === 'draft') return 'Esta enquete ainda não foi publicada.';
  if (poll.expired) return 'O prazo desta enquete terminou.';
  if (!poll.canVote) return 'Esta enquete não está aceitando votos.';
  return null;
}

async function callVotePoll(
  method: 'GET' | 'POST',
  pollId: string,
  body?: unknown
): Promise<PollView> {
  const url =
    method === 'GET' ? VOTE_POLL_URL + '?pollId=' + encodeURIComponent(pollId) : VOTE_POLL_URL;

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

  return payload.poll as PollView;
}

export default function VotePoll() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const pollQuery = useQuery({
    queryKey: ['public-poll', id],
    queryFn: () => callVotePoll('GET', id),
    enabled: Boolean(id),
    retry: false,
  });
  const poll = pollQuery.data ?? null;
  const loading = pollQuery.isPending;
  let loadError: string | null = null;
  if (pollQuery.error) {
    loadError =
      pollQuery.error instanceof Error ? pollQuery.error.message : 'Enquete não encontrada.';
  }
  const [selectedOption, setSelectedOption] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  async function handleVote() {
    if (!poll || !selectedOption) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await callVotePoll('POST', id, {
        pollId: poll.id,
        optionId: selectedOption,
        voterName: voterName.trim() || undefined,
        voterEmail: voterEmail.trim() || undefined,
      });
      setVoted(true);
      await queryClient.invalidateQueries({ queryKey: ['public-poll', id] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível registrar o voto.';
      setSubmitError(message);
      await queryClient.invalidateQueries({ queryKey: ['public-poll', id] });
    } finally {
      setSubmitting(false);
    }
  }

  const total = poll ? poll.options.reduce((sum, option) => sum + option.votesCount, 0) : 0;
  const reason = poll ? blockedReason(poll) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Enquete
          </CardTitle>
          <CardDescription>
            {poll ? poll.question : 'Responda escolhendo uma das opções abaixo.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {!loading && loadError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <span>{loadError}</span>
            </div>
          )}

          {!loading && poll && voted && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Voto registrado. Obrigado por participar!</span>
            </div>
          )}

          {!loading && poll && !voted && submitError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <span>{submitError}</span>
            </div>
          )}

          {!loading && poll && !voted && reason && (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{reason}</span>
            </div>
          )}

          {!loading && poll && !voted && !reason && (
            <div className="space-y-4">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center gap-2 rounded-lg border p-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="voter-name">Seu nome (opcional)</Label>
                  <Input
                    id="voter-name"
                    value={voterName}
                    onChange={(event) => setVoterName(event.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="voter-email">Seu e-mail (opcional)</Label>
                  <Input
                    id="voter-email"
                    type="email"
                    value={voterEmail}
                    onChange={(event) => setVoterEmail(event.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>
            </div>
          )}

          {!loading && poll && (voted || reason) && (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                {total} voto(s) até agora
              </p>
              {poll.options.map((option) => {
                const percentage = total > 0 ? Math.round((option.votesCount / total) * 100) : 0;
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{option.label}</span>
                      <span className="text-muted-foreground">
                        {option.votesCount} · {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              {poll.allowMultipleVotes && (
                <Badge variant="outline">Esta enquete aceita mais de um voto por pessoa</Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!loading && poll && !voted && !reason && (
            <Button
              type="button"
              className="w-full"
              onClick={handleVote}
              disabled={!selectedOption || submitting}
            >
              {submitting ? 'Enviando...' : 'Votar'}
            </Button>
          )}
          {!loading && poll && voted && poll.allowMultipleVotes && !reason && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setVoted(false);
                setSelectedOption('');
              }}
            >
              Votar novamente
            </Button>
          )}
          <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Conhecer o FUXICO
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
