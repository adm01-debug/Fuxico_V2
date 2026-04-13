import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';

export const CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'users', label: 'Usuários' },
  { value: 'security', label: 'Segurança' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'templates', label: 'Templates' },
  { value: 'audit', label: 'Auditoria' },
  { value: 'data', label: 'Dados' },
];

interface Permission {
  id: string;
  name: string;
  description: string | null;
  permission_key: string;
  category: string;
}

interface NewPermission {
  name: string;
  description: string;
  permission_key: string;
  category: string;
}

export function CreatePermissionDialog({
  open, onOpenChange, newPermission, setNewPermission, onSubmit, isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPermission: NewPermission;
  setNewPermission: (p: NewPermission) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="w-4 h-4 mr-2" />Nova Permissão</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Permissão</DialogTitle>
          <DialogDescription>Adicione uma nova permissão ao sistema</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="perm-name">Nome</Label>
            <Input id="perm-name" placeholder="Ex: Gerenciar Usuários" value={newPermission.name}
              onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-key">Chave</Label>
            <Input id="perm-key" placeholder="Ex: manage_users" value={newPermission.permission_key}
              onChange={(e) => setNewPermission({ ...newPermission, permission_key: e.target.value.toLowerCase().replace(/\s/g, '_') })} />
            <p className="text-xs text-muted-foreground">Identificador único usado no código</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-category">Categoria</Label>
            <Select value={newPermission.category} onValueChange={(v) => setNewPermission({ ...newPermission, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-desc">Descrição</Label>
            <Textarea id="perm-desc" placeholder="Descreva o que esta permissão permite fazer..."
              value={newPermission.description} onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={!newPermission.name || !newPermission.permission_key || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditPermissionDialog({
  permission, onClose, onSubmit, isPending,
}: {
  permission: Permission | null;
  onClose: () => void;
  onSubmit: (perm: Permission) => void;
  isPending: boolean;
}) {
  if (!permission) return null;

  return (
    <Dialog open={!!permission} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Permissão</DialogTitle>
          <DialogDescription>Modifique os detalhes da permissão</DialogDescription>
        </DialogHeader>
        <EditPermissionForm permission={permission} onClose={onClose} onSubmit={onSubmit} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}

function EditPermissionForm({ permission, onClose, onSubmit, isPending }: {
  permission: Permission; onClose: () => void; onSubmit: (p: Permission) => void; isPending: boolean;
}) {
  const [local, setLocal] = useState(permission);

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome</Label>
          <Input id="edit-name" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-key">Chave</Label>
          <Input id="edit-key" value={local.permission_key}
            onChange={(e) => setLocal({ ...local, permission_key: e.target.value.toLowerCase().replace(/\s/g, '_') })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category">Categoria</Label>
          <Select value={local.category} onValueChange={(v) => setLocal({ ...local, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-desc">Descrição</Label>
          <Textarea id="edit-desc" value={local.description || ''}
            onChange={(e) => setLocal({ ...local, description: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit(local)} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
        </Button>
      </DialogFooter>
    </>
  );
}
