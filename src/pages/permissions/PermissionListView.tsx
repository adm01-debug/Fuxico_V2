import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';
import { CATEGORIES } from './PermissionFormDialog';

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

interface PermissionListViewProps {
  permissions?: Permission[];
  rolePermissions?: RolePermission[];
  isLoading: boolean;
  onEdit: (perm: Permission) => void;
  onDelete: (id: string) => void;
}

export function PermissionListView({ permissions, rolePermissions, isLoading, onEdit, onDelete }: PermissionListViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas as Permissões</CardTitle>
        <CardDescription>Gerencie todas as permissões do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
              {permissions?.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{perm.name}</p>
                      {perm.description && <p className="text-xs text-muted-foreground line-clamp-1">{perm.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{perm.permission_key}</code></TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => onEdit(perm)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm('Tem certeza que deseja remover esta permissão?')) onDelete(perm.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
