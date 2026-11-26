// =============================================================================
// FUXICO - Painel de lembretes de follow-up vencidos
//
// Consome a RPC `get_due_reminders`, que devolve os lembretes pendentes cujo
// e-mail ainda nao teve abertura e cujo prazo (reminder_days) venceu.
// =============================================================================

import { BellRing, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  useDueReminders,
  useUpdateReminderStatus,
  useDeleteReminder,
} from '@/hooks/use-follow-up-reminders';

interface DueReminderRow {
  id: string;
  tracking_id: string;
  reminder_days: number;
  recipient_email: string | null;
  subject: string | null;
  created_at: string;
}

function daysSince(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

export function FollowUpRemindersCard() {
  const { data, isLoading } = useDueReminders();
  const updateStatus = useUpdateReminderStatus();
  const deleteReminder = useDeleteReminder();

  const reminders = (data ?? []) as DueReminderRow[];

  if (isLoading || reminders.length === 0) return null;

  const handleMarkSeen = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'sent' });
      toast({ title: 'Lembrete marcado como visto' });
    } catch (error) {
      toast({
        title: 'Nao foi possivel atualizar o lembrete',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteReminder.mutateAsync(id);
      toast({ title: 'Lembrete removido' });
    } catch (error) {
      toast({
        title: 'Nao foi possivel remover o lembrete',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="m-4 border-primary/30 bg-primary/5" data-testid="follow-up-reminders">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
          Lembretes vencidos ({reminders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border/60">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center justify-between gap-3 py-2"
              data-testid={`reminder-${reminder.id}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{reminder.subject || 'Sem assunto'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {reminder.recipient_email ?? 'Destinatario desconhecido'} &middot;{' '}
                  {daysSince(reminder.created_at)} dias sem abertura (alerta em{' '}
                  {reminder.reminder_days} dias)
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Marcar o lembrete de ${reminder.subject || 'e-mail'} como visto`}
                  disabled={updateStatus.isPending}
                  onClick={() => void handleMarkSeen(reminder.id)}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remover o lembrete de ${reminder.subject || 'e-mail'}`}
                  disabled={deleteReminder.isPending}
                  onClick={() => void handleRemove(reminder.id)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default FollowUpRemindersCard;
