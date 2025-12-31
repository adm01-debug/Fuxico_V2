import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Shield, Key, Save, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
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
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
    enabled: isAdmin,
  });

  // Fetch role permissions
  const { data: rolePermissions } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: isAdmin,
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const changes = Array.from(pendingChanges.entries());
      
      for (const [permissionId, isEnabled] of changes) {
        if (isEnabled) {
          // Add permission
          await supabase.from('role_permissions').upsert({
            role: selectedRole,
            permission_id: permissionId,
          }, { onConflict: 'role,permission_id' });
        } else {
          // Remove permission
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
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao salvar permissões');
    },
  });

  const hasPermission = (permissionId: string) => {
    // Check pending changes first
    if (pendingChanges.has(permissionId)) {
      return pendingChanges.get(permissionId);
    }
    // Otherwise check database
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Matriz de Permissões</h1>
              <p className="text-muted-foreground">
                Configure permissões para cada role
              </p>
            </div>
          </div>
          
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
              Salvar ({pendingChanges.size} alterações)
            </Button>
          )}
        </div>

        {/* Role Selector */}
        <Tabs value={selectedRole} onValueChange={(v) => {
          setSelectedRole(v as 'admin' | 'user');
          setPendingChanges(new Map());
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">
              <Key className="w-4 h-4 mr-2" />
              Usuário
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 mr-2" />
              Administrador
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedRole} className="space-y-4">
            {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {perms.map((perm) => (
                    <div 
                      key={perm.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <Checkbox
                        id={perm.id}
                        checked={hasPermission(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        disabled={selectedRole === 'admin'} // Admin always has all permissions
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={perm.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {perm.name}
                        </label>
                        {perm.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {perm.description}
                          </p>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {perm.permission_key}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {selectedRole === 'admin' && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              <strong>Nota:</strong> Administradores têm acesso completo a todas as permissões 
              e não podem ter permissões removidas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
