import React, { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  useCampaigns, 
  useCreateCampaign, 
  useUpdateCampaign, 
  useDeleteCampaign,
  CampaignWithStats 
} from '@/hooks/use-campaigns';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  FolderOpen,
  Mail,
  MousePointerClick,
  Eye,
  TrendingUp,
  Archive,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function CampaignsTabBase() {
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStats | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    await createCampaign.mutateAsync(formData);
    setFormData({ name: '', description: '' });
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingCampaign || !formData.name.trim()) return;
    await updateCampaign.mutateAsync({ 
      id: editingCampaign.id, 
      name: formData.name,
      description: formData.description 
    });
    setEditingCampaign(null);
    setFormData({ name: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  const handleArchive = async (campaign: CampaignWithStats) => {
    await updateCampaign.mutateAsync({ 
      id: campaign.id, 
      status: campaign.status === 'archived' ? 'active' : 'archived' 
    });
  };

  const openEditDialog = (campaign: CampaignWithStats) => {
    setEditingCampaign(campaign);
    setFormData({ name: campaign.name, description: campaign.description || '' });
  };

  // Calculate totals
  const totals = campaigns?.reduce((acc, c) => ({
    emails: acc.emails + c.total_emails,
    opens: acc.opens + c.total_opens,
    clicks: acc.clicks + c.total_clicks,
  }), { emails: 0, opens: 0, clicks: 0 }) || { emails: 0, opens: 0, clicks: 0 };

  if (isLoading) {
    return <CampaignsSkeleton />;
  }

  return (
    <div role="region" aria-label="CampaignsTab" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Campanhas</h2>
            <p className="text-muted-foreground">Organize e compare performance de suas campanhas</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma campanha para agrupar e comparar emails relacionados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Black Friday 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo desta campanha..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createCampaign.isPending || !formData.name.trim()}>
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card role="article">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campanhas</p>
                <p className="text-2xl font-bold">{campaigns?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card role="article">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emails</p>
                <p className="text-2xl font-bold">{totals.emails}</p>
              </div>
              <div className="p-3 bg-green-500/10 text-green-500 rounded-full">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card role="article">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Aberturas</p>
                <p className="text-2xl font-bold">{totals.opens}</p>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cliques</p>
                <p className="text-2xl font-bold">{totals.clicks}</p>
              </div>
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-full">
                <MousePointerClick className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparativo de Campanhas
          </CardTitle>
          <CardDescription>
            Veja a performance de cada campanha lado a lado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns && campaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Emails</TableHead>
                  <TableHead className="text-center">Aberturas</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-center">Taxa Abertura</TableHead>
                  <TableHead className="text-center">Taxa Cliques</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status === 'active' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Ativa</>
                        ) : (
                          <><Archive className="h-3 w-3 mr-1" /> Arquivada</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{campaign.total_emails}</TableCell>
                    <TableCell className="text-center">{campaign.total_opens}</TableCell>
                    <TableCell className="text-center">{campaign.total_clicks}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={campaign.open_rate >= 20 ? 'default' : 'secondary'}>
                        {campaign.open_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={campaign.click_rate >= 5 ? 'default' : 'secondary'}>
                        {campaign.click_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(campaign.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(campaign)}>
                            <Archive className="h-4 w-4 mr-2" />
                            {campaign.status === 'active' ? 'Arquivar' : 'Reativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(campaign.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              type="campaigns"
              title="Nenhuma campanha criada"
              description="Crie campanhas para organizar e comparar a performance dos seus emails"
              action={
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Atualize as informações da campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Campanha</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCampaign(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateCampaign.isPending || !formData.name.trim()}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const CampaignsTab = memo(CampaignsTabBase);
export default CampaignsTab;
