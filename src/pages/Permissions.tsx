import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Key, Save, Loader2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePermissionDialog, EditPermissionDialog } from './permissions/PermissionFormDialog';
import { PermissionMatrix } from './permissions/PermissionMatrix';
import { PermissionListView } from './permissions/PermissionListView';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  permission_key: string;
  category: string;
}

interface RolePermission {
  id: string;
  role: 'admin' | 'user';
  permission_id: string;
}

export default function Permissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [newPermission, setNewPermission] = useState({ name: '', description: '', permission_key: '', category: 'general' });

  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('permissions').select('*').order('category').order('name');
      if (error) throw error;
      return data as Permission[];
    },
    enabled: isAdmin === true,
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: isAdmin === true,
  });

  const createPermissionMutation = useMutation({
    mutationFn: async (perm: typeof newPermission) => {
      const { error } = await supabase.from('permissions').insert({ name: perm.name, description: perm.description || null, permission_key: perm.permission_key, category: perm.category });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions'] }); setShowCreateDialog(false); setNewPermission({ name: '', description: '', permission_key: '', category: 'general' }); toast.success('Permissão criada com sucesso'); },
    onError: (err: Error) => { toast.error(err.message || 'Erro ao criar permissão'); },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async (perm: Permission) => {
      const { error } = await supabase.from('permissions').update({ name: perm.name, description: perm.description, permission_key: perm.permission_key, category: perm.category }).eq('id', perm.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions'] }); setEditingPermission(null); toast.success('Permissão atualizada'); },
    onError: (err: Error) => { toast.error(err.message || 'Erro ao atualizar permissão'); },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('role_permissions').delete().eq('permission_id', id);
      const { error } = await supabase.from('permissions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['permissions'] }); queryClient.invalidateQueries({ queryKey: ['rolePermissions'] }); toast.success('Permissão removida'); },
    onError: (err: Error) => { toast.error(err.message || 'Erro ao remover permissão'); },
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      for (const [permissionId, isEnabled] of Array.from(pendingChanges.entries())) {
        if (isEnabled) {
          await supabase.from('role_permissions').upsert({ role: selectedRole, permission_id: permissionId }, { onConflict: 'role,permission_id' });
        } else {
          await supabase.from('role_permissions').delete().eq('role', selectedRole).eq('permission_id', permissionId);
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rolePermissions'] }); setPendingChanges(new Map()); toast.success('Permissões salvas com sucesso'); },
    onError: (err: Error) => { toast.error(err.message || 'Erro ao salvar permissões'); },
  });

  const hasPermission = (permissionId: string) => {
    if (pendingChanges.has(permissionId)) return pendingChanges.get(permissionId);
    return rolePermissions?.some(rp => rp.role === selectedRole && rp.permission_id === permissionId);
  };

  const togglePermission = (permissionId: string) => {
    const currentValue = hasPermission(permissionId);
    setPendingChanges(new Map(pendingChanges.set(permissionId, !currentValue)));
  };

  const userPermissionCount = rolePermissions?.filter(rp => rp.role === 'user').length ?? 0;
  const adminPermissionCount = permissions?.length ?? 0;

  if (isCheckingAdmin) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4"><Shield className="w-6 h-6 text-destructive" /></div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
          <CardContent><Button className="w-full" onClick={() => navigate('/')}>Voltar ao Início</Button></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1>
              <p className="text-muted-foreground">Configure permissões granulares por role</p>
            </div>
          </div>
          <div className="flex gap-2">
            <CreatePermissionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}
              newPermission={newPermission} setNewPermission={setNewPermission}
              onSubmit={() => createPermissionMutation.mutate(newPermission)} isPending={createPermissionMutation.isPending} />
            {pendingChanges.size > 0 && (
              <Button onClick={() => savePermissionsMutation.mutate()} disabled={savePermissionsMutation.isPending}>
                {savePermissionsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar ({pendingChanges.size})
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><Key className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{permissions?.length ?? 0}</p><p className="text-xs text-muted-foreground">Total de Permissões</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{userPermissionCount}</p><p className="text-xs text-muted-foreground">Permissões do Usuário</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-green-500/10 rounded-lg"><Shield className="w-5 h-5 text-green-500" /></div><div><p className="text-2xl font-bold">{adminPermissionCount}</p><p className="text-xs text-muted-foreground">Permissões do Admin</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="matrix">
          <TabsList>
            <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
            <TabsTrigger value="list">Lista de Permissões</TabsTrigger>
          </TabsList>
          <TabsContent value="matrix" className="space-y-4">
            <PermissionMatrix selectedRole={selectedRole}
              onRoleChange={(r) => { setSelectedRole(r); setPendingChanges(new Map()); }}
              permissions={permissions} isLoading={isLoadingPermissions}
              hasPermission={hasPermission} togglePermission={togglePermission} />
          </TabsContent>
          <TabsContent value="list">
            <PermissionListView permissions={permissions} rolePermissions={rolePermissions}
              isLoading={isLoadingPermissions} onEdit={setEditingPermission}
              onDelete={(id) => deletePermissionMutation.mutate(id)} />
          </TabsContent>
        </Tabs>

        <EditPermissionDialog permission={editingPermission} onClose={() => setEditingPermission(null)}
          onSubmit={(perm) => updatePermissionMutation.mutate(perm)} isPending={updatePermissionMutation.isPending} />
      </div>
    </div>
  );
}
