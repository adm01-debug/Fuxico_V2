import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Plus, Trash2, Eye, Check, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailTemplates, type EmailTemplate } from '@/hooks/use-email-templates';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { createTracking } from '@/features/tracking/lib/tracking-api';
import { extractTrackableLinks, injectTracking } from '@/features/tracking/lib/render-tracking';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/navigation/UnsavedChangesDialog';

const EMPTY_TEMPLATE = { name: '', subject: '', body: '', category: 'Geral' };

function TemplatesTabBase() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, incrementUsage } =
    useEmailTemplates();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[0] | null>(null);
  const [isPreparing, setIsPreparing] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState(EMPTY_TEMPLATE);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_TEMPLATE);

  const createIsDirty = Object.entries(newTemplate).some(
    ([key, value]) => value !== EMPTY_TEMPLATE[key as keyof typeof EMPTY_TEMPLATE]
  );
  const editIsDirty =
    editingTemplate !== null &&
    (editForm.name !== editingTemplate.name ||
      editForm.subject !== editingTemplate.subject ||
      editForm.body !== editingTemplate.body ||
      editForm.category !== editingTemplate.category);

  const createGuard = useUnsavedChanges({ when: isCreateOpen && createIsDirty });
  const editGuard = useUnsavedChanges({ when: editIsDirty });

  const closeCreate = () => {
    createGuard.confirmClose(() => {
      setNewTemplate(EMPTY_TEMPLATE);
      setIsCreateOpen(false);
    });
  };

  const closeEdit = () => {
    editGuard.confirmClose(() => {
      setEditingTemplate(null);
      setEditForm(EMPTY_TEMPLATE);
    });
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    });
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    if (!editForm.name.trim() || !editForm.subject.trim() || !editForm.body.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...editForm });
      setEditingTemplate(null);
      setEditForm(EMPTY_TEMPLATE);
    } catch {
      // erro já notificado pelo hook
    }
  };

  const handleCopyTemplate = async (template: (typeof templates)[0]) => {
    setIsPreparing(template.id);
    try {
      // Solicita o destinatário para criar tracking end-to-end.
      const recipient = window
        .prompt('E-mail do destinatário (para gerar pixel + links de tracking):', '')
        ?.trim();
      if (!recipient) {
        setIsPreparing(null);
        return;
      }

      const links = extractTrackableLinks(template.body);
      const tracking = await createTracking({
        recipientEmail: recipient,
        subject: template.subject,
        links,
        metadata: { template_id: template.id, source: 'templates-tab' },
      });

      const linkMap: Record<string, string> = {};
      for (const w of tracking.wrappedLinks) linkMap[w.original] = w.linkId;

      const baseUrl = window.location.origin;
      const bodyWithTracking = injectTracking(template.body, {
        trackingId: tracking.trackingId,
        baseUrl,
        linkMap,
      });

      await navigator.clipboard.writeText(bodyWithTracking);
      incrementUsage.mutate(template.id);
      toast.success('Template copiado com tracking pronto!', {
        description: `Pixel /api/public/track/open.gif + ${links.length} link(s) reescrito(s).`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao preparar tracking';
      toast.error('Não foi possível preparar o template', { description: message });
    } finally {
      setIsPreparing(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('Preencha todos os campos');
      return;
    }

    await createTemplate.mutateAsync(newTemplate);
    setNewTemplate(EMPTY_TEMPLATE);
    setIsCreateOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate.mutate(id);
  };

  const handlePreview = (template: (typeof templates)[0]) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const categories = [...new Set(templates.map((t) => t.category))];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates de Email</CardTitle>
              <CardDescription>Templates prontos com pixel de tracking integrado</CardDescription>
            </div>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(o) => (o ? setIsCreateOpen(true) : closeCreate())}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Template</DialogTitle>
                  <DialogDescription>
                    Crie um novo template de email. O pixel de tracking será inserido
                    automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Template</Label>
                      <Input
                        placeholder="Ex: Proposta Comercial"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input
                        placeholder="Ex: Comercial"
                        value={newTemplate.category}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, category: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input
                      placeholder="Use {{variavel}} para campos dinâmicos"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Corpo do Email</Label>
                    <Textarea
                      placeholder="Escreva o corpo do email..."
                      className="min-h-[200px]"
                      value={newTemplate.body}
                      onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dica: Use {'{{nome}}'}, {'{{empresa}}'}, {'{{produto}}'} para variáveis
                      dinâmicas
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateTemplate}
                    className="w-full"
                    disabled={createTemplate.isPending}
                  >
                    {createTemplate.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Criar Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {templates.length === 0 ? (
            <EmptyState
              type="templates"
              title="Nenhum template criado"
              description="Crie templates prontos com pixel de tracking integrado para enviar emails profissionais rapidamente."
              action={
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Template
                </Button>
              }
            />
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">{template.subject}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {template.body.slice(0, 150)}...
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Usado {template.usage_count}x
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(template)}
                            aria-label={`Editar ${template.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyTemplate(template)}
                            disabled={isPreparing === template.id}
                            aria-label="Copiar com tracking"
                          >
                            {isPreparing === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={deleteTemplate.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Preview do template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-muted-foreground">Assunto:</Label>
              <p className="font-medium">{selectedTemplate?.subject}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Corpo:</Label>
              <div className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm">
                {selectedTemplate?.body}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedTemplate) handleCopyTemplate(selectedTemplate);
                setIsPreviewOpen(false);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingTemplate !== null}
        onOpenChange={(o) => {
          if (!o) closeEdit();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Ajuste nome, categoria, assunto e corpo. As variáveis {'{{nome}}'} permanecem
              disponíveis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Corpo do Email</Label>
              <Textarea
                className="min-h-[200px]"
                value={editForm.body}
                onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeEdit}
                disabled={updateTemplate.isPending}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateTemplate}
                disabled={updateTemplate.isPending || !editIsDirty}
              >
                {updateTemplate.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Salvar alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={createGuard.isBlocked}
        onConfirm={createGuard.discard}
        onCancel={createGuard.keepEditing}
      />
      <UnsavedChangesDialog
        open={editGuard.isBlocked}
        onConfirm={editGuard.discard}
        onCancel={editGuard.keepEditing}
      />
    </div>
  );
}

export const TemplatesTab = memo(TemplatesTabBase);
export default TemplatesTab;
