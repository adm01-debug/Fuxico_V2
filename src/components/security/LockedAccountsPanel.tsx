import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Search, RefreshCw, AlertTriangle, Clock, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface LoginLockout {
  id: string;
  email: string;
  failed_attempts: number;
  lockout_until: string | null;
  last_failed_at: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export function LockedAccountsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all locked accounts
  const { data: lockouts, isLoading, refetch } = useQuery({
    queryKey: ['login-lockouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_lockouts')
        .select('*')
        .order('lockout_until', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as LoginLockout[];
    },
  });

  // Mutation to unlock account
  const unlockMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.rpc('reset_login_lockout', { _email: email });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-lockouts'] });
      toast.success('Conta desbloqueada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao desbloquear conta: ' + error.message);
    },
  });

  // Filter lockouts
  const filteredLockouts = lockouts?.filter(lockout =>
    lockout.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lockout.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Separate active lockouts from history
  const now = new Date();
  const activeLockouts = filteredLockouts.filter(l => 
    l.lockout_until && new Date(l.lockout_until) > now
  );
  const historicalLockouts = filteredLockouts.filter(l => 
    !l.lockout_until || new Date(l.lockout_until) <= now
  );

  const isLocked = (lockout: LoginLockout) => {
    if (!lockout.lockout_until) return false;
    return new Date(lockout.lockout_until) > now;
  };

  const getTimeRemaining = (lockoutUntil: string) => {
    const until = new Date(lockoutUntil);
    if (until <= now) return 'Expirado';
    return formatDistanceToNow(until, { locale: ptBR, addSuffix: true });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Contas Bloqueadas
            </CardTitle>
            <CardDescription>
              Visualize e desbloqueie contas que foram bloqueadas por tentativas de login
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-destructive/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{activeLockouts.length}</div>
            <div className="text-sm text-muted-foreground">Bloqueados Agora</div>
          </div>
          <div className="bg-warning/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">{historicalLockouts.length}</div>
            <div className="text-sm text-muted-foreground">Histórico</div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{lockouts?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Active Lockouts Section */}
        {activeLockouts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Contas Bloqueadas Ativamente ({activeLockouts.length})
            </h3>
            <div className="rounded-md border border-destructive/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Desbloqueia</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLockouts.map((lockout) => (
                    <TableRow key={lockout.id}>
                      <TableCell className="font-medium">{lockout.email}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{lockout.failed_attempts}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lockout.ip_address || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(lockout.lockout_until!)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Unlock className="h-4 w-4 mr-1" />
                              Desbloquear
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Desbloquear conta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você está prestes a desbloquear a conta <strong>{lockout.email}</strong>.
                                Isso permitirá que o usuário tente fazer login novamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => unlockMutation.mutate(lockout.email)}
                                disabled={unlockMutation.isPending}
                              >
                                {unlockMutation.isPending ? 'Desbloqueando...' : 'Confirmar'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Historical Lockouts Section */}
        {historicalLockouts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Histórico de Bloqueios ({historicalLockouts.length})
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Última Falha</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalLockouts.slice(0, 10).map((lockout) => (
                    <TableRow key={lockout.id}>
                      <TableCell className="font-medium">{lockout.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lockout.failed_attempts}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lockout.ip_address || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lockout.last_failed_at 
                          ? format(new Date(lockout.last_failed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600">
                          Expirado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        )}
        
        {!isLoading && filteredLockouts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma conta bloqueada encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LockedAccountsPanel;
