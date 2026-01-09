import { memo } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useFollowUpReminders, 
  useDueReminders, 
  useCreateReminder, 
  useUpdateReminderStatus,
  useDeleteReminder 
} from '@/hooks/use-follow-up-reminders';
import { useTrackedEmails } from '@/hooks/use-tracking';
import { Bell, BellRing, Clock, Mail, Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Sparkles, Wand2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AIFollowUpDialog } from './AIFollowUpDialog';

function FollowUpTabBase() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [reminderDays, setReminderDays] = useState('3');
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'cancelled'>('all');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedEmailForAI, setSelectedEmailForAI] = useState<{
    recipient_email: string;
    subject: string;
    days_since_sent: number;
    tracking_id: string;
  } | null>(null);

  const { data: reminders = [], isLoading } = useFollowUpReminders();
  const { data: dueReminders = [] } = useDueReminders();
  const { data: emails = [] } = useTrackedEmails({});
  const createReminder = useCreateReminder();
  const updateStatus = useUpdateReminderStatus();
  const deleteReminder = useDeleteReminder();

  const filteredReminders = reminders.filter(r => filter === 'all' || r.status === filter);
  
  const stats = {
    pending: reminders.filter(r => r.status === 'pending').length,
    due: dueReminders.length,
    sent: reminders.filter(r => r.status === 'sent').length,
  };

  const handleCreate = async () => {
    if (!selectedEmail) {
      toast.error('Selecione um email');
      return;
    }
    
    try {
      await createReminder.mutateAsync({
        trackingId: selectedEmail,
        reminderDays: parseInt(reminderDays),
      });
      toast.success('Lembrete criado com sucesso');
      setIsCreateOpen(false);
      setSelectedEmail('');
    } catch (error) {
      toast.error('Erro ao criar lembrete');
    }
  };

  const handleMarkAsSent = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'sent' });
      toast.success('Lembrete marcado como enviado');
    } catch (error) {
      toast.error('Erro ao atualizar lembrete');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'cancelled' });
      toast.success('Lembrete cancelado');
    } catch (error) {
      toast.error('Erro ao cancelar lembrete');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder.mutateAsync(id);
      toast.success('Lembrete excluído');
    } catch (error) {
      toast.error('Erro ao excluir lembrete');
    }
  };

  const getStatusBadge = (status: string, daysSinceSent: number, reminderDays: number) => {
    const isDue = status === 'pending' && daysSinceSent >= reminderDays;
    
    if (isDue) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Vencido</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'sent':
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Enviado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" /> Cancelado</Badge>;
      case 'opened':
        return <Badge className="gap-1 bg-blue-500"><Mail className="h-3 w-3" /> Aberto</Badge>;
      default:
        return null;
    }
  };

  // Get emails that don't have a reminder yet
  const availableEmails = emails.filter(
    email => !reminders.some(r => r.tracking_id === email.tracking_id && r.status === 'pending')
  );

  return (
    <div role="region" aria-label="FollowUpTab" className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando follow-up</p>
          </CardContent>
        </Card>

        <Card className={stats.due > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <BellRing className={`h-4 w-4 ${stats.due > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.due > 0 ? 'text-destructive' : ''}`}>{stats.due}</div>
            <p className="text-xs text-muted-foreground">Precisam de ação</p>
          </CardContent>
        </Card>

        <Card role="article">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Follow-ups realizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Due Reminders Alert */}
      {stats.due > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BellRing className="h-4 w-4 text-destructive" />
              {stats.due} {stats.due === 1 ? 'email precisa' : 'emails precisam'} de follow-up!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dueReminders.slice(0, 3).map((reminder: any) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 bg-background rounded">
                  <div>
                    <p className="text-sm font-medium">{reminder.recipient_email}</p>
                    <p className="text-xs text-muted-foreground">{reminder.subject || 'Sem assunto'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setSelectedEmailForAI({
                          recipient_email: reminder.recipient_email,
                          subject: reminder.subject || 'Sem assunto',
                          days_since_sent: Math.floor(
                            (Date.now() - new Date(reminder.created_at).getTime()) / (1000 * 60 * 60 * 24)
                          ),
                          tracking_id: reminder.tracking_id
                        });
                        setAiDialogOpen(true);
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                      IA
                    </Button>
                    <Button size="sm" onClick={() => handleMarkAsSent(reminder.id)}>
                      Marcar Enviado
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Lembrete de Follow-up</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um email" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmails.map(email => (
                      <SelectItem key={email.tracking_id} value={email.tracking_id}>
                        {email.recipient_email} - {email.subject || 'Sem assunto'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lembrar após (dias)</label>
                <Select value={reminderDays} onValueChange={setReminderDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="2">2 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={createReminder.isPending}>
                {createReminder.isPending ? 'Criando...' : 'Criar Lembrete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders Table */}
      <Card role="article">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead>Lembrar após</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredReminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum lembrete encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.recipient_email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {reminder.subject || 'Sem assunto'}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(reminder.email_created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell>{reminder.reminder_days} dias</TableCell>
                    <TableCell>
                      {getStatusBadge(reminder.status, reminder.days_since_sent, reminder.reminder_days)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {reminder.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEmailForAI({
                                  recipient_email: reminder.recipient_email,
                                  subject: reminder.subject || 'Sem assunto',
                                  days_since_sent: reminder.days_since_sent,
                                  tracking_id: reminder.tracking_id
                                });
                                setAiDialogOpen(true);
                              }}
                              title="Sugestão de IA"
                              className="gap-1"
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsSent(reminder.id)}
                              title="Marcar como enviado"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(reminder.id)}
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(reminder.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Follow-up Dialog */}
      <AIFollowUpDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        email={selectedEmailForAI}
        onCreateReminder={async (trackingId) => {
          try {
            await createReminder.mutateAsync({
              trackingId,
              reminderDays: 3,
            });
          } catch (error) {
            toast.error('Erro ao criar lembrete');
          }
        }}
      />
    </div>
  );
}


export const FollowUpTab = memo(FollowUpTabBase);
