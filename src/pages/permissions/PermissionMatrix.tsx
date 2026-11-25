import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Key, Shield, Users } from 'lucide-react';
import { CATEGORIES } from './permission-categories';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  permission_key: string;
  category: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  general: <Key className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
};

interface PermissionMatrixProps {
  selectedRole: 'admin' | 'user';
  onRoleChange: (role: 'admin' | 'user') => void;
  permissions?: Permission[];
  isLoading: boolean;
  hasPermission: (id: string) => boolean | undefined;
  togglePermission: (id: string) => void;
}

export function PermissionMatrix({
  selectedRole,
  onRoleChange,
  permissions,
  isLoading,
  hasPermission,
  togglePermission,
}: PermissionMatrixProps) {
  const groupedPermissions = permissions?.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <Tabs value={selectedRole} onValueChange={(v) => onRoleChange(v as 'admin' | 'user')}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="user">
          <Users className="mr-2 h-4 w-4" />
          Usuário
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Shield className="mr-2 h-4 w-4" />
          Administrador
        </TabsTrigger>
      </TabsList>

      <TabsContent value={selectedRole} className="mt-4 space-y-4">
        {selectedRole === 'admin' && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              <strong>Nota:</strong> Administradores têm acesso completo a todas as permissões e não
              podem ter permissões removidas.
            </p>
          </div>
        )}

        {isLoading ? (
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
          groupedPermissions &&
          Object.entries(groupedPermissions).map(([category, perms]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {CATEGORY_ICONS[category] || <Key className="h-4 w-4" />}
                  <span className="capitalize">
                    {CATEGORIES.find((c) => c.value === category)?.label || category}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {perms.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      hasPermission(perm.id)
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-transparent bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      id={perm.id}
                      checked={hasPermission(perm.id) ?? false}
                      onCheckedChange={() => togglePermission(perm.id)}
                      disabled={selectedRole === 'admin'}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={perm.id} className="block cursor-pointer text-sm font-medium">
                        {perm.name}
                      </label>
                      {perm.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2 font-mono text-xs">
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
  );
}
