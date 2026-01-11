import { memo, useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  Plus, 
  Mail, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Send,
  Trash2,
  Ban,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  useScheduledEmails, 
  useCreateScheduledEmail, 
  useCancelScheduledEmail,
  useDeleteScheduledEmail,
  CreateScheduledEmail 
} from '@/hooks/use-scheduled-emails';

function getStatusBadge(status: string, scheduledAt: string) {
  const isOverdue = isPast(new Date(scheduledAt)) && status === 'pending';
  
  if (isOverdue) {
    return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Atrasado</Badge>;
  }
  
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Agendado</Badge>;
    case 'sent':
      return <Badge className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" />Enviado</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Cancelado</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Falhou</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function CreateEmailDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void 
}) {
  const createEmail = useCreateScheduledEmail();
  const [formData, setFormData] = useState<CreateScheduledEmail>({
    recipient_email: '',
    sender_email: '',
    subject: '',
    body: '',
    scheduled_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipient_email || !formData.subject || !formData.scheduled_at) {
      return;
    }

    await createEmail.mutateAsync(formData);
    onOpenChange(false);
    setFormData({
      recipient_email: '',
      sender_email: '',
      subject: '',
      body: '',
      scheduled_at: '',
    });
  };

  // Get min datetime for the input (now + 5 minutes)
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Agendar Novo Email
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes do email que será enviado na data e hora programadas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} role="region" aria-label="EmailSchedulingTab" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário *</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.recipient_email}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender">Remetente</Label>
              <Input
                id="sender"
                type="email"
                placeholder="seu@email.com"
                value={formData.sender_email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_email: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              placeholder="Assunto do email"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Corpo do Email</Label>
            <Textarea
              id="body"
              placeholder="Conteúdo do email..."
              rows={4}
              value={formData.body || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data e Hora do Envio *
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              min={minDatetime}
              value={formData.scheduled_at}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEmail.isPending}>
              {createEmail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Agendar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmailSchedulingTabBase() {
  const { data: emails, isLoading, error } = useScheduledEmails();
  const cancelEmail = useCancelScheduledEmail();
  const deleteEmail = useDeleteScheduledEmail();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card role="article">
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Erro ao carregar emails agendados</p>
        </CardContent>
      </Card>
    );
  }

  const pendingEmails = emails?.filter(e => e.status === 'pending') || [];
  const sentEmails = emails?.filter(e => e.status === 'sent') || [];
  const cancelledEmails = emails?.filter(e => e.status === 'cancelled') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div role="region" aria-label="EmailSchedulingTab" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Emails Agendados
          </h2>
          <p className="text-muted-foreground mt-1">
            Agende emails para serem enviados em datas futuras
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Email
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card role="article">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-3xl font-bold">{pendingEmails.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card role="article">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-3xl font-bold">{sentEmails.length}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-3xl font-bold">{cancelledEmails.length}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Emails</CardTitle>
          <CardDescription>
            Todos os emails agendados, enviados e cancelados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emails?.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum email agendado</h3>
              <p className="text-muted-foreground mb-4">
                Clique em "Agendar Email" para criar seu primeiro agendamento.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agendar Email
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Agendado para</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails?.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="font-medium">{email.recipient_email}</div>
                      {email.sender_email && (
                        <div className="text-xs text-muted-foreground">
                          De: {email.sender_email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(email.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.scheduled_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(email.status, email.scheduled_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {email.status === 'pending' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Ban className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O email não será enviado. Esta ação pode ser desfeita agendando novamente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelEmail.mutate(email.id)}
                                  disabled={cancelEmail.isPending}
                                >
                                  Cancelar Envio
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir email?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O registro será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEmail.mutate(email.id)}
                                disabled={deleteEmail.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateEmailDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
}


export const EmailSchedulingTab = memo(EmailSchedulingTabBase);
export default EmailSchedulingTab;
