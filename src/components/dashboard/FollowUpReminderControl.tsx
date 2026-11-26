// =============================================================================
// FUXICO - Agendamento de lembrete de follow-up para um e-mail rastreado
//
// Usa a edge function `create-reminder` (validacao de dono + rate limit) para
// gravar em `follow_up_reminders`. O lembrete aparece no painel de vencidos
// assim que o prazo passar sem abertura.
// =============================================================================

import { useState } from 'react';
import { BellPlus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useCreateReminder, usePendingReminders } from '@/hooks/use-follow-up-reminders';

const REMINDER_DAY_OPTIONS = [1, 3, 7, 14];

interface FollowUpReminderControlProps {
  trackingId: string;
}

export function FollowUpReminderControl({ trackingId }: FollowUpReminderControlProps) {
  const [days, setDays] = useState('3');
  const { data: pendingReminders } = usePendingReminders();
  const createReminder = useCreateReminder();

  const existing = (pendingReminders ?? []).find((item) => item.tracking_id === trackingId);

  if (existing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        Lembrete agendado para {existing.reminder_days} dia(s) apos o envio.
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      await createReminder.mutateAsync({ trackingId, reminderDays: Number(days) });
      toast({
        title: 'Lembrete agendado',
        description: `Voce sera avisado se nao houver abertura em ${days} dia(s).`,
      });
    } catch (error) {
      toast({
        title: 'Nao foi possivel agendar o lembrete',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="rounded-lg border border-border/60 p-3">
      <Label htmlFor={`reminder-days-${trackingId}`} className="text-xs font-medium">
        Lembrar-me se este e-mail nao for aberto em
      </Label>
      <div className="mt-2 flex items-center gap-2">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger id={`reminder-days-${trackingId}`} className="h-8 w-28 text-xs">
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_DAY_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} dia{option > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={createReminder.isPending}
          onClick={() => void handleCreate()}
        >
          {createReminder.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <BellPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Agendar lembrete
        </Button>
      </div>
    </div>
  );
}

export default FollowUpReminderControl;
