import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, Check, TrendingUp, Lightbulb } from 'lucide-react';

interface Suggestion {
  subject: string;
  reason: string;
  estimatedOpenRate: string;
}

interface SubjectSuggestionDialogProps {
  onSelectSubject?: (subject: string) => void;
  trigger?: React.ReactNode;
}

export function SubjectSuggestionDialog({ onSelectSubject, trigger }: SubjectSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState('');
  const [recipientType, setRecipientType] = useState('profissional');
  const [tone, setTone] = useState('profissional');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { mutate: generateSuggestions, data: suggestions, isPending: isLoading } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('suggest-subject', {
        body: { context, recipientType, tone }
      });

      if (error) throw error;
      return data.suggestions as Suggestion[];
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar sugestões',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCopy = (subject: string, index: number) => {
    navigator.clipboard.writeText(subject);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: 'Copiado!',
      description: 'Assunto copiado para a área de transferência',
    });
  };

  const handleSelect = (subject: string) => {
    onSelectSubject?.(subject);
    setOpen(false);
    toast({
      title: 'Assunto selecionado',
      description: 'O assunto foi aplicado ao seu email',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Sugerir Assunto com IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestão de Assunto com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o contexto do seu email e receba sugestões de assuntos otimizados para alta taxa de abertura
          </DialogDescription>
        </DialogHeader>

        <div role="region" aria-label="Sugestão de Assunto" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="context">Contexto do Email</Label>
            <Textarea
              id="context"
              placeholder="Ex: Apresentação de novo produto para clientes B2B do setor de tecnologia..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Destinatário</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional/B2B</SelectItem>
                  <SelectItem value="consumidor">Consumidor/B2C</SelectItem>
                  <SelectItem value="leads">Leads Frios</SelectItem>
                  <SelectItem value="clientes">Clientes Existentes</SelectItem>
                  <SelectItem value="parceiros">Parceiros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tom da Mensagem</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="amigavel">Amigável</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="informativo">Informativo</SelectItem>
                  <SelectItem value="persuasivo">Persuasivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => generateSuggestions()} 
            disabled={isLoading || !context.trim()}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>Gerando sugestões...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Sugestões
              </>
            )}
          </Button>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Sugestões Geradas
              </h4>
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="font-medium text-foreground">{suggestion.subject}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {suggestion.estimatedOpenRate}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(suggestion.subject, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {onSelectSubject && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelect(suggestion.subject)}
                          >
                            Usar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
