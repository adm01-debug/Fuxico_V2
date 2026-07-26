import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Search,
  Globe,
  Clock,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { matchFirst } from "@/lib/variant";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  metadata: Record<string, unknown>;
}

export default function BlockedIPsPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('24h');
  const [isPermanent, setIsPermanent] = useState(false);

  // Fetch blocked IPs
  const { data: blockedIPs, isLoading } = useQuery({
    queryKey: ['blockedIPs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      return data as BlockedIP[];
    },
  });

  // Add blocked IP
  const addMutation = useMutation({
    mutationFn: async () => {
      let expiresAt: string | null = null;
      
      if (!isPermanent) {
        const hours = parseInt(duration);
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase.from('blocked_ips').insert({
        ip_address: newIP.trim(),
        reason,
        expires_at: expiresAt,
        is_permanent: isPermanent,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
      toast.success('IP bloqueado com sucesso');
      setShowAddDialog(false);
      setNewIP('');
      setReason('');
      setDuration('24h');
      setIsPermanent(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao bloquear IP');
    },
  });

  // Remove blocked IP
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blocked_ips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedIPs'] });
      toast.success('IP desbloqueado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao desbloquear IP');
    },
  });

  const filteredIPs = blockedIPs?.filter(ip =>
    ip.ip_address.includes(search) || ip.reason.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle>IPs Bloqueados</CardTitle>
              <CardDescription>
                Gerencie IPs que estão bloqueados de acessar o sistema
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Bloquear IP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por IP ou motivo..."
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
  [filteredIPs?.length === 0, () => ((
          <div className="text-center py-8 text-muted-foreground">
            Nenhum IP bloqueado
          </div>
        ))],
], () => ((
          <div className="space-y-2">
            {filteredIPs?.map((ip) => (
              <div
                key={ip.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isExpired(ip.expires_at) ? 'bg-muted/30 opacity-60' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium">{ip.ip_address}</p>
                      {matchFirst([
                        [ip.is_permanent, () => <Badge variant="destructive">Permanente</Badge>],
                        [isExpired(ip.expires_at), () => <Badge variant="outline">Expirado</Badge>],
                      ], () => <Badge variant="secondary">Temporário</Badge>)}

                    </div>
                    <p className="text-sm text-muted-foreground">{ip.reason}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Bloqueado em {new Date(ip.blocked_at).toLocaleDateString()}
                      </span>
                      {ip.expires_at && !ip.is_permanent && (
                        <span>
                          Expira em {new Date(ip.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm('Deseja desbloquear este IP?')) {
                      removeMutation.mutate(ip.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )))}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear IP</DialogTitle>
            <DialogDescription>
              Adicione um IP à lista de bloqueio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Endereço IP</Label>
              <Input
                placeholder="192.168.1.1 ou 192.168.1.0/24"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                placeholder="Atividade suspeita, tentativas de login..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bloqueio Permanente</Label>
                <p className="text-xs text-muted-foreground">
                  O IP ficará bloqueado indefinidamente
                </p>
              </div>
              <Switch checked={isPermanent} onCheckedChange={setIsPermanent} />
            </div>
            {!isPermanent && (
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="72">3 dias</SelectItem>
                    <SelectItem value="168">7 dias</SelectItem>
                    <SelectItem value="720">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newIP || !reason || addMutation.isPending}
            >
              {addMutation.isPending ? 'Bloqueando...' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
