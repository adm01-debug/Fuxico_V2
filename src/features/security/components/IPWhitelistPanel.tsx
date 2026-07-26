import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Plus, 
  Trash2, 
  Search,
  Globe,
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
import { Textarea } from '@/components/ui/textarea';
import { matchFirst } from "@/lib/variant";

interface WhitelistedIP {
  id: string;
  ip_address: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function IPWhitelistPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [description, setDescription] = useState('');

  // Fetch whitelisted IPs
  const { data: whitelistedIPs, isLoading } = useQuery({
    queryKey: ['whitelistedIPs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WhitelistedIP[];
    },
  });

  // Add whitelisted IP
  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('ip_whitelist').insert({
        ip_address: newIP.trim(),
        description: description || null,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistedIPs'] });
      toast.success('IP adicionado à whitelist');
      setShowAddDialog(false);
      setNewIP('');
      setDescription('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao adicionar IP');
    },
  });

  // Toggle IP status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ip_whitelist')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistedIPs'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar status');
    },
  });

  // Remove whitelisted IP
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ip_whitelist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistedIPs'] });
      toast.success('IP removido da whitelist');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao remover IP');
    },
  });

  const filteredIPs = whitelistedIPs?.filter(ip =>
    ip.ip_address.includes(search) || 
    ip.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle>IP Whitelist</CardTitle>
              <CardDescription>
                IPs confiáveis que ignoram verificações de rate limit
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar IP
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por IP ou descrição..."
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
            Nenhum IP na whitelist
          </div>
        ))],
], () => ((
          <div className="space-y-2">
            {filteredIPs?.map((ip) => (
              <div
                key={ip.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  ip.is_active ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium">{ip.ip_address}</p>
                      <Badge variant={ip.is_active ? 'default' : 'secondary'}>
                        {ip.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {ip.description && (
                      <p className="text-sm text-muted-foreground">{ip.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Adicionado em {new Date(ip.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={ip.is_active}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: ip.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Deseja remover este IP da whitelist?')) {
                        removeMutation.mutate(ip.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )))}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar IP à Whitelist</DialogTitle>
            <DialogDescription>
              IPs na whitelist ignoram verificações de rate limit
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
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Servidor de produção, VPN corporativa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newIP || addMutation.isPending}
            >
              {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
