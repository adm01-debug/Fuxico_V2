import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Key, Save, Loader2, Plus, Trash2, Edit, Users, Lock, Eye, Settings, BarChart3, Webhook, Mail, FileText, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  general: <Settings className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />,
  security: <Lock className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
  webhooks: <Webhook className="w-4 h-4" />,
  templates: <Mail className="w-4 h-4" />,
  audit: <FileText className="w-4 h-4" />,
  data: <Eye className="w-4 h-4" />,
};

const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'users', label: 'Usuários' },
  { value: 'security', label: 'Segurança' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'templates', label: 'Templates' },
  { value: 'audit', label: 'Auditoria' },
  { value: 'data', label: 'Dados' },
];

export default function Permissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    permission_key: '',
    category: 'general',
  });

  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all permissions
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
    enabled: isAdmin === true,
  });

  // Fetch role permissions
  const { data: rolePermissions, isLoading: isLoadingRolePermissions } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: isAdmin === true,
  });

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (perm: typeof newPermission) => {
      const { error } = await supabase.from('permissions').insert({
        name: perm.name,
        description: perm.description || null,
        permission_key: perm.permission_key,
        category: perm.category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setShowCreateDialog(false);
      setNewPermission({ name: '', description: '', permission_key: '', category: 'general' });
      toast.success('Permissão criada com sucesso');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao criar permissão');
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async (perm: Permission) => {
      const { error } = await supabase.from('permissions')
        .update({
          name: perm.name,
          description: perm.description,
          permission_key: perm.permission_key,
          category: perm.category,
        })
        .eq('id', perm.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setEditingPermission(null);
      toast.success('Permissão atualizada');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar permissão');
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete role_permissions
      await supabase.from('role_permissions').delete().eq('permission_id', id);
      // Then delete permission
      const { error } = await supabase.from('permissions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      toast.success('Permissão removida');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao remover permissão');
    },
  });

  // Save role permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const changes = Array.from(pendingChanges.entries());
      
      for (const [permissionId, isEnabled] of changes) {
        if (isEnabled) {
          await supabase.from('role_permissions').upsert({
            role: selectedRole,
            permission_id: permissionId,
          }, { onConflict: 'role,permission_id' });
        } else {
          await supabase.from('role_permissions')
            .delete()
            .eq('role', selectedRole)
            .eq('permission_id', permissionId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      setPendingChanges(new Map());
      toast.success('Permissões salvas com sucesso');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao salvar permissões');
    },
  });

  const hasPermission = (permissionId: string) => {
    if (pendingChanges.has(permissionId)) {
      return pendingChanges.get(permissionId);
    }
    return rolePermissions?.some(
      rp => rp.role === selectedRole && rp.permission_id === permissionId
    );
  };

  const togglePermission = (permissionId: string) => {
    const currentValue = hasPermission(permissionId);
    setPendingChanges(new Map(pendingChanges.set(permissionId, !currentValue)));
  };

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Permission counts per role
  const userPermissionCount = rolePermissions?.filter(rp => rp.role === 'user').length ?? 0;
  const adminPermissionCount = permissions?.length ?? 0; // Admin has all

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1>
              <p className="text-muted-foreground">
                Configure permissões granulares por role
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Permissão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Permissão</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova permissão ao sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="perm-name">Nome</Label>
                    <Input
                      id="perm-name"
                      placeholder="Ex: Gerenciar Usuários"
                      value={newPermission.name}
                      onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-key">Chave</Label>
                    <Input
                      id="perm-key"
                      placeholder="Ex: manage_users"
                      value={newPermission.permission_key}
                      onChange={(e) => setNewPermission({ 
                        ...newPermission, 
                        permission_key: e.target.value.toLowerCase().replace(/\s/g, '_') 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Identificador único usado no código
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-category">Categoria</Label>
                    <Select
                      value={newPermission.category}
                      onValueChange={(v) => setNewPermission({ ...newPermission, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-desc">Descrição</Label>
                    <Textarea
                      id="perm-desc"
                      placeholder="Descreva o que esta permissão permite fazer..."
                      value={newPermission.description}
                      onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createPermissionMutation.mutate(newPermission)}
                    disabled={!newPermission.name || !newPermission.permission_key || createPermissionMutation.isPending}
                  >
                    {createPermissionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {pendingChanges.size > 0 && (
              <Button 
                onClick={() => savePermissionsMutation.mutate()}
                disabled={savePermissionsMutation.isPending}
              >
                {savePermissionsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar ({pendingChanges.size})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{permissions?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Permissões</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userPermissionCount}</p>
                  <p className="text-xs text-muted-foreground">Permissões do Usuário</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{adminPermissionCount}</p>
                  <p className="text-xs text-muted-foreground">Permissões do Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="matrix">
          <TabsList>
            <TabsTrigger value="matrix">Matriz de Permissões</TabsTrigger>
            <TabsTrigger value="list">Lista de Permissões</TabsTrigger>
          </TabsList>

          {/* Matrix View */}
          <TabsContent value="matrix" className="space-y-4">
            <Tabs value={selectedRole} onValueChange={(v) => {
              setSelectedRole(v as 'admin' | 'user');
              setPendingChanges(new Map());
            }}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="user">
                  <Users className="w-4 h-4 mr-2" />
                  Usuário
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Administrador
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedRole} className="space-y-4 mt-4">
                {selectedRole === 'admin' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      <strong>Nota:</strong> Administradores têm acesso completo a todas as permissões 
                      e não podem ter permissões removidas.
                    </p>
                  </div>
                )}

                {isLoadingPermissions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <Skeleton className="h-32 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {CATEGORY_ICONS[category] || <Key className="w-4 h-4" />}
                          <span className="capitalize">{CATEGORIES.find(c => c.value === category)?.label || category}</span>
                          <Badge variant="secondary" className="ml-2">
                            {perms.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        {perms.map((perm) => (
                          <div 
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              hasPermission(perm.id) ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'
                            }`}
                          >
                            <Checkbox
                              id={perm.id}
                              checked={hasPermission(perm.id) ?? false}
                              onCheckedChange={() => togglePermission(perm.id)}
                              disabled={selectedRole === 'admin'}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <label 
                                htmlFor={perm.id}
                                className="text-sm font-medium cursor-pointer block"
                              >
                                {perm.name}
                              </label>
                              {perm.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {perm.description}
                                </p>
                              )}
                              <Badge variant="outline" className="mt-2 text-xs font-mono">
                                {perm.permission_key}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Permissões</CardTitle>
                <CardDescription>
                  Gerencie todas as permissões do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Chave</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions?.map((perm) => {
                        const roleCount = (rolePermissions?.filter(rp => rp.permission_id === perm.id).length ?? 0) + 1; // +1 for admin
                        return (
                          <TableRow key={perm.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{perm.name}</p>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {perm.permission_key}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {CATEGORIES.find(c => c.value === perm.category)?.label || perm.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge variant="default" className="text-xs">admin</Badge>
                                {rolePermissions?.some(rp => rp.permission_id === perm.id && rp.role === 'user') && (
                                  <Badge variant="secondary" className="text-xs">user</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingPermission(perm)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja remover esta permissão?')) {
                                      deletePermissionMutation.mutate(perm.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Permission Dialog */}
        <Dialog open={!!editingPermission} onOpenChange={(open) => !open && setEditingPermission(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Permissão</DialogTitle>
              <DialogDescription>
                Modifique os detalhes da permissão
              </DialogDescription>
            </DialogHeader>
            {editingPermission && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input
                    id="edit-name"
                    value={editingPermission.name}
                    onChange={(e) => setEditingPermission({ ...editingPermission, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-key">Chave</Label>
                  <Input
                    id="edit-key"
                    value={editingPermission.permission_key}
                    onChange={(e) => setEditingPermission({ 
                      ...editingPermission, 
                      permission_key: e.target.value.toLowerCase().replace(/\s/g, '_') 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoria</Label>
                  <Select
                    value={editingPermission.category}
                    onValueChange={(v) => setEditingPermission({ ...editingPermission, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-desc">Descrição</Label>
                  <Textarea
                    id="edit-desc"
                    value={editingPermission.description || ''}
                    onChange={(e) => setEditingPermission({ ...editingPermission, description: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPermission(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => editingPermission && updatePermissionMutation.mutate(editingPermission)}
                disabled={updatePermissionMutation.isPending}
              >
                {updatePermissionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
