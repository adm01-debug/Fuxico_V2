import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Plus, Trash2, Eye, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailTemplates } from '@/hooks/use-email-templates';
import { Skeleton } from '@/components/ui/skeleton';

export function TemplatesTab() {
  const { templates, isLoading, createTemplate, deleteTemplate, incrementUsage } = useEmailTemplates();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Geral',
  });

  const handleCopyTemplate = async (template: typeof templates[0]) => {
    const pixelHtml = `\n\n<!-- FUXICO Tracking Pixel - Será inserido automaticamente -->`;
    const bodyWithPixel = template.body + pixelHtml;
    
    await navigator.clipboard.writeText(bodyWithPixel);
    incrementUsage.mutate(template.id);
    toast.success('Template copiado!', {
      description: 'O pixel de tracking será inserido automaticamente ao enviar.',
    });
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('Preencha todos os campos');
      return;
    }

    await createTemplate.mutateAsync(newTemplate);
    setNewTemplate({ name: '', subject: '', body: '', category: 'Geral' });
    setIsCreateOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate.mutate(id);
  };

  const handlePreview = (template: typeof templates[0]) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const categories = [...new Set(templates.map(t => t.category))];

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
              {[1, 2, 3].map(i => (
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
              <CardDescription>
                Templates prontos com pixel de tracking integrado
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Template</DialogTitle>
                  <DialogDescription>
                    Crie um novo template de email. O pixel de tracking será inserido automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Template</Label>
                      <Input 
                        placeholder="Ex: Proposta Comercial"
                        value={newTemplate.name}
                        onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input 
                        placeholder="Ex: Comercial"
                        value={newTemplate.category}
                        onChange={e => setNewTemplate({...newTemplate, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input 
                      placeholder="Use {{variavel}} para campos dinâmicos"
                      value={newTemplate.subject}
                      onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Corpo do Email</Label>
                    <Textarea 
                      placeholder="Escreva o corpo do email..."
                      className="min-h-[200px]"
                      value={newTemplate.body}
                      onChange={e => setNewTemplate({...newTemplate, body: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dica: Use {"{{nome}}"}, {"{{empresa}}"}, {"{{produto}}"} para variáveis dinâmicas
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateTemplate} 
                    className="w-full"
                    disabled={createTemplate.isPending}
                  >
                    {createTemplate.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
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
            <div className="flex gap-2 mb-4 flex-wrap">
              {categories.map(cat => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
              ))}
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum template criado ainda.</p>
              <p className="text-sm">Clique em "Novo Template" para começar.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="grid gap-4">
                {templates.map(template => (
                  <Card key={template.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {template.subject}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.body.slice(0, 150)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Usado {template.usage_count}x
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handlePreview(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCopyTemplate(template)}>
                            <Copy className="h-4 w-4" />
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
            <DialogDescription>
              Preview do template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground text-sm">Assunto:</Label>
              <p className="font-medium">{selectedTemplate?.subject}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Corpo:</Label>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedTemplate?.body}
              </div>
            </div>
            <Button className="w-full" onClick={() => {
              if (selectedTemplate) handleCopyTemplate(selectedTemplate);
              setIsPreviewOpen(false);
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplatesTab;
