import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  KeyRound,
  Check, 
  X, 
  Search,
  Clock,
  Loader2,
  Mail,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { matchFirst } from "@/lib/variant";

interface PasswordResetRequest {
  id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
  completed: { label: 'Concluído', variant: 'outline' },
  expired: { label: 'Expirado', variant: 'outline' },
};

export default function PasswordResetRequestsPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['passwordResetRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as PasswordResetRequest[];
    },
  });

  // Approve request
  const approveMutation = useMutation({
    mutationFn: async (request: PasswordResetRequest) => {
      // Update status to approved
      const { error: updateError } = await supabase
        .from('password_reset_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Send password reset email via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwordResetRequests'] });
      toast.success('Solicitação aprovada. Email de reset enviado.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao aprovar solicitação');
    },
  });

  // Reject request
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwordResetRequests'] });
      toast.success('Solicitação rejeitada');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao rejeitar solicitação');
    },
  });

  const filteredRequests = requests?.filter(req =>
    req.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <KeyRound className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Solicitações de Reset de Senha
                {pendingCount > 0 && (
                  <Badge variant="destructive">{pendingCount} pendente(s)</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Aprove ou rejeite solicitações de redefinição de senha
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {matchFirst([
  [isLoading, () => ((
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ))],
  [filteredRequests?.length === 0, () => ((
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma solicitação encontrada
          </div>
        ))],
], () => ((
          <div className="space-y-3">
            {filteredRequests?.map((request) => {
              const isExpired = new Date(request.expires_at) < new Date();
              const status = isExpired && request.status === 'pending' ? 'expired' : request.status;
              const config = statusConfig[status];

              return (
                <div
                  key={request.id}
                  className={`p-4 rounded-lg border ${
                    status === 'pending' ? 'bg-warning/5 border-warning/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{request.email}</span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(request.requested_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {request.ip_address && (
                          <span>IP: {request.ip_address}</span>
                        )}
                      </div>
                      {request.rejection_reason && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{request.rejection_reason}</span>
                        </div>
                      )}
                    </div>
                    {status === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/50 hover:bg-success/10"
                          onClick={() => approveMutation.mutate(request)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/50 hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedRequest(request);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )))}
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={selectedRequest?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Textarea
                placeholder="Ex: Solicitação suspeita, usuário não reconhecido..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  rejectMutation.mutate({ 
                    id: selectedRequest.id, 
                    reason: rejectionReason 
                  });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
