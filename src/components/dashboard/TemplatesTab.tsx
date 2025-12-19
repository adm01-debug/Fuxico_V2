import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, Plus, Trash2, Eye, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt: string;
  usageCount: number;
}

// Templates pré-definidos
const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Proposta Comercial',
    subject: 'Proposta Comercial - {{empresa}}',
    body: `Prezado(a) {{nome}},

Conforme nossa conversa, segue a proposta comercial para {{produto}}.

[Detalhes da proposta aqui]

Qualquer dúvida, estou à disposição.

Atenciosamente,
{{remetente}}`,
    category: 'Comercial',
    createdAt: new Date().toISOString(),
    usageCount: 45,
  },
  {
    id: '2',
    name: 'Follow-up Orçamento',
    subject: 'Re: Orçamento - {{produto}}',
    body: `Olá {{nome}},

Estou entrando em contato para saber se teve a oportunidade de analisar nosso orçamento enviado em {{data}}.

Caso tenha alguma dúvida ou precise de ajustes, estou à disposição para conversarmos.

Aguardo seu retorno!

Abraços,
{{remetente}}`,
    category: 'Follow-up',
    createdAt: new Date().toISOString(),
    usageCount: 32,
  },
  {
    id: '3',
    name: 'Agradecimento Pedido',
    subject: 'Obrigado pelo pedido! - {{numero_pedido}}',
    body: `Prezado(a) {{nome}},

Agradecemos por escolher a Promo Brindes!

Seu pedido #{{numero_pedido}} foi recebido com sucesso e está em processamento.

Prazo de entrega estimado: {{prazo}}

Qualquer dúvida, entre em contato conosco.

Atenciosamente,
Equipe Promo Brindes`,
    category: 'Pós-venda',
    createdAt: new Date().toISOString(),
    usageCount: 89,
  },
];

export function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Geral',
  });

  const handleCopyTemplate = (template: EmailTemplate) => {
    // Adicionar pixel de tracking ao final do body
    const pixelHtml = `\n\n<!-- FUXICO Tracking Pixel - Será inserido automaticamente -->`;
    const bodyWithPixel = template.body + pixelHtml;
    
    navigator.clipboard.writeText(bodyWithPixel);
    toast.success('Template copiado!', {
      description: 'O pixel de tracking será inserido automaticamente ao enviar.',
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.error('Preencha todos os campos');
      return;
    }

    const template: EmailTemplate = {
      id: Date.now().toString(),
      ...newTemplate,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', subject: '', body: '', category: 'Geral' });
    setIsCreateOpen(false);
    toast.success('Template criado com sucesso!');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success('Template removido');
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const categories = [...new Set(templates.map(t => t.category))];

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
                  <Button onClick={handleCreateTemplate} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros por categoria */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>

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
                          Usado {template.usageCount}x
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyTemplate(template)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de Preview */}
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
