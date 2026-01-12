import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  UserPlus, 
  MoreVertical, 
  Pause, 
  Play, 
  XCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Users
} from 'lucide-react';
import { SequenceEnrollment, useEnrollContact, useCancelEnrollment, useUpdateEnrollment } from '@/hooks/useEmailSequences';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SequenceEnrollmentsProps {
  enrollments: SequenceEnrollment[];
  sequenceId: string;
  totalSteps: number;
}

const statusConfig: Record<SequenceEnrollment['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  active: { label: 'Ativo', variant: 'default', icon: <Play className="h-3 w-3" /> },
  paused: { label: 'Pausado', variant: 'outline', icon: <Pause className="h-3 w-3" /> },
  completed: { label: 'Completo', variant: 'secondary', icon: <CheckCircle className="h-3 w-3" /> },
  replied: { label: 'Respondeu', variant: 'default', icon: <MessageSquare className="h-3 w-3" /> },
  bounced: { label: 'Bounced', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  unsubscribed: { label: 'Descadastrou', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelado', variant: 'secondary', icon: <XCircle className="h-3 w-3" /> },
};

export function SequenceEnrollments({ enrollments, sequenceId, totalSteps }: SequenceEnrollmentsProps) {
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');

  const enrollContact = useEnrollContact();
  const cancelEnrollment = useCancelEnrollment();
  const updateEnrollment = useUpdateEnrollment();

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    await enrollContact.mutateAsync({
      sequenceId,
      contactEmail: newContactEmail,
      contactName: newContactName || undefined,
    });
    setNewContactEmail('');
    setNewContactName('');
    setIsEnrollDialogOpen(false);
  };

  const handlePauseResume = async (enrollment: SequenceEnrollment) => {
    await updateEnrollment.mutateAsync({
      id: enrollment.id,
      status: enrollment.status === 'paused' ? 'active' : 'paused',
    });
  };

  const handleCancel = async (enrollment: SequenceEnrollment) => {
    await cancelEnrollment.mutateAsync({
      id: enrollment.id,
      sequenceId,
    });
  };

  const activeCount = enrollments.filter(e => e.status === 'active').length;
  const completedCount = enrollments.filter(e => e.status === 'completed').length;
  const repliedCount = enrollments.filter(e => e.status === 'replied').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{enrollments.length}</span>
            <span className="text-muted-foreground">inscritos</span>
          </div>
          <Badge variant="outline">{activeCount} ativos</Badge>
          <Badge variant="secondary">{completedCount} completos</Badge>
          <Badge variant="default">{repliedCount} respostas</Badge>
        </div>
        <Button onClick={() => setIsEnrollDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Inscrever Contato
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-8 text-center">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum contato inscrito</h3>
          <p className="text-muted-foreground mb-4">
            Inscreva contatos para iniciar a sequência de follow-ups automatizados.
          </p>
          <Button onClick={() => setIsEnrollDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Inscrever Primeiro Contato
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Próximo Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inscrito</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => {
                const status = statusConfig[enrollment.status];
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{enrollment.contact_name || enrollment.contact_email}</p>
                        {enrollment.contact_name && (
                          <p className="text-sm text-muted-foreground">{enrollment.contact_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${totalSteps > 0 ? (enrollment.current_step / totalSteps) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {enrollment.current_step}/{totalSteps}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.next_step_at && enrollment.status === 'active' ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(enrollment.next_step_at), "dd/MM HH:mm")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        {status.icon}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          {(enrollment.status === 'active' || enrollment.status === 'paused') && (
                            <DropdownMenuItem onClick={() => handlePauseResume(enrollment)}>
                              {enrollment.status === 'paused' ? (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Retomar
                                </>
                              ) : (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pausar
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          {enrollment.status !== 'cancelled' && enrollment.status !== 'completed' && (
                            <DropdownMenuItem 
                              onClick={() => handleCancel(enrollment)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrever Contato na Sequência</DialogTitle>
            <DialogDescription>
              O contato receberá automaticamente os emails da sequência conforme as etapas configuradas.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEnroll}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Contato *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome (opcional)</Label>
                <Input
                  id="name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Nome do contato"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!newContactEmail || enrollContact.isPending}>
                <UserPlus className="h-4 w-4 mr-2" />
                Inscrever
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
