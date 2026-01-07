import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy, Clock, Lightbulb, CheckCircle, Loader2, Mail, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AIFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: {
    recipient_email: string;
    subject: string;
    days_since_sent: number;
    tracking_id: string;
  } | null;
  onCreateReminder?: (trackingId: string) => void;
}

interface FollowUpSuggestion {
  subject: string;
  body: string;
  effectiveness: number;
  approach: string;
}

interface AIResponse {
  suggestions: FollowUpSuggestion[];
  bestTimeToSend: string;
  tips: string[];
}

export function AIFollowUpDialog({ open, onOpenChange, email, onCreateReminder }: AIFollowUpDialogProps) {
  const [tone, setTone] = useState<'formal' | 'friendly' | 'urgent'>('friendly');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-followup', {
        body: {
          originalSubject: email.subject || 'Sem assunto',
          recipientEmail: email.recipient_email,
          daysSinceOriginal: email.days_since_sent,
          originalContext: context,
          tone,
          language: 'pt-BR'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (error) {
      console.error('Error generating follow-up:', error);
      toast.error('Erro ao gerar sugestões de follow-up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (suggestion: FollowUpSuggestion, index: number) => {
    const text = `Assunto: ${suggestion.subject}\n\n${suggestion.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopySubject = async (subject: string) => {
    await navigator.clipboard.writeText(subject);
    toast.success('Assunto copiado!');
  };

  const handleCopyBody = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success('Corpo do email copiado!');
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleClose = () => {
    onOpenChange(false);
    setResult(null);
    setContext('');
  };

  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Follow-up Automático com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Destinatário:</span>
                  <p className="font-medium">{email.recipient_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dias sem resposta:</span>
                  <p className="font-medium">{email.days_since_sent} dias</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Assunto original:</span>
                  <p className="font-medium">{email.subject || 'Sem assunto'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {!result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom do email</label>
                  <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">🤝 Amigável</SelectItem>
                      <SelectItem value="formal">👔 Formal</SelectItem>
                      <SelectItem value="urgent">⚡ Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contexto adicional (opcional)</label>
                <Textarea
                  placeholder="Ex: O cliente demonstrou interesse no produto X durante a reunião..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                className="w-full gap-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando sugestões...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Sugestões de Follow-up
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Tips and Best Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Melhor horário para envio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{result.bestTimeToSend}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Dicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-muted-foreground">• {tip}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {result.suggestions.map((suggestion, i) => (
                    <TabsTrigger key={i} value={String(i)} className="gap-2">
                      <Zap className="h-3 w-3" />
                      Opção {i + 1}
                      <Badge variant="outline" className={`text-xs ${getEffectivenessColor(suggestion.effectiveness)}`}>
                        {suggestion.effectiveness}%
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {result.suggestions.map((suggestion, i) => (
                  <TabsContent key={i} value={String(i)} className="mt-4">
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{suggestion.approach}</Badge>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getEffectivenessColor(suggestion.effectiveness)}`}>
                              Eficácia: {suggestion.effectiveness}%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Assunto:</label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopySubject(suggestion.subject)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <div className="p-3 bg-muted rounded-md">
                            <p className="font-medium">{suggestion.subject}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Corpo do email:</label>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyBody(suggestion.body)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <div className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                            {suggestion.body}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            className="flex-1 gap-2"
                            onClick={() => handleCopy(suggestion, i)}
                          >
                            {copiedIndex === i ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar Tudo
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              if (onCreateReminder) {
                                onCreateReminder(email.tracking_id);
                                toast.success('Lembrete criado!');
                              }
                            }}
                          >
                            <Mail className="h-4 w-4" />
                            Criar Lembrete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              <Button variant="outline" onClick={() => setResult(null)} className="w-full">
                Gerar Novas Sugestões
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
