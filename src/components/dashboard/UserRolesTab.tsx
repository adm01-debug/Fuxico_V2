import { log } from '@/lib/logger';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, User, Search, UserMinus, UserPlus } from "lucide-react";
import { useUsersWithRoles, useAssignRole, useRemoveRole, type UserWithRole } from "@/hooks/use-user-roles";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function UserRolesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: 'assign' | 'remove';
    user: UserWithRole;
    newRole?: 'admin' | 'user';
  } | null>(null);

  const { data: users = [], isLoading } = useUsersWithRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "none" && user.role === null) ||
      user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAssignRole = (user: UserWithRole, role: 'admin' | 'user') => {
    setConfirmAction({ type: 'assign', user, newRole: role });
  };

  const handleRemoveRole = (user: UserWithRole) => {
    setConfirmAction({ type: 'remove', user });
  };

  const confirmRoleChange = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'assign' && confirmAction.newRole) {
        await assignRole.mutateAsync({ 
          userId: confirmAction.user.user_id, 
          role: confirmAction.newRole 
        });
        toast.success(`Role ${confirmAction.newRole} atribuído a ${confirmAction.user.email}`);
      } else if (confirmAction.type === 'remove') {
        await removeRole.mutateAsync(confirmAction.user.user_id);
        toast.success(`Role removido de ${confirmAction.user.email}`);
      }
    } catch (error) {
      toast.error("Erro ao atualizar role");
      log.error(error as Error);
    } finally {
      setConfirmAction(null);
    }
  };

  const getRoleBadge = (role: 'admin' | 'user' | null) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 gap-1">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    if (role === 'user') {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
          <User className="h-3 w-3" />
          Usuário
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <User className="h-3 w-3" />
        Sem role
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciamento de Roles
            </CardTitle>
            <CardDescription>
              Atribua ou remova permissões de administrador para usuários
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="none">Sem role</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role Atual</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.created_at 
                      ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignRole(user, 'admin')}
                          className="gap-1"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Tornar Admin
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignRole(user, 'user')}
                          className="gap-1"
                        >
                          <User className="h-4 w-4" />
                          Rebaixar
                        </Button>
                      )}
                      {user.role && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(user)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                          Remover
                        </Button>
                      )}
                      {!user.role && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignRole(user, 'user')}
                          className="gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Atribuir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'assign' 
                ? `Atribuir role ${confirmAction.newRole}?`
                : 'Remover role?'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'assign' ? (
                <>
                  Você está prestes a atribuir o role <strong>{confirmAction.newRole}</strong> para{" "}
                  <strong>{confirmAction.user.email}</strong>.
                  {confirmAction.newRole === 'admin' && (
                    <span className="block mt-2 text-orange-600">
                      Administradores têm acesso completo ao painel de auditoria e gerenciamento de roles.
                    </span>
                  )}
                </>
              ) : (
                <>
                  Você está prestes a remover o role de <strong>{confirmAction?.user.email}</strong>.
                  O usuário perderá todas as permissões especiais.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Default export for lazy loading
export default UserRolesTab;
