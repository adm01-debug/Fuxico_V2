import { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Pause, Trophy, Trash2, Loader2, FlaskConical, Mail, Target, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useABTests } from '@/hooks/use-ab-tests';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ABTestResultsDialog } from './ABTestResultsDialog';

function ABTestingTabBase() {
  const { tests = [], isLoading, createTest, startTest, pauseTest, completeTest, deleteTest } = useABTests();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    variant_a_subject: '',
    variant_b_subject: '',
    variant_a_body: '',
    variant_b_body: '',
    recipient_email: '',
    min_score: 0,
    last_open_days: 0,
    min_sample_size: 30,
    auto_promote: true,
  });

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.variant_a_subject || !newTest.variant_b_subject) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await createTest.mutateAsync({
      name: newTest.name,
      variant_a_subject: newTest.variant_a_subject,
      variant_b_subject: newTest.variant_b_subject,
      variant_a_body: newTest.variant_a_body || undefined,
      variant_b_body: newTest.variant_b_body || undefined,
      recipient_email: newTest.recipient_email || undefined,
      min_sample_size: newTest.min_sample_size,
      auto_promote: newTest.auto_promote,
      segment_filters: {
        ...(newTest.min_score > 0 ? { min_score: newTest.min_score } : {}),
        ...(newTest.last_open_days > 0 ? { last_open_days: newTest.last_open_days } : {}),
      },
    });
    setNewTest({
      name: '', variant_a_subject: '', variant_b_subject: '',
      variant_a_body: '', variant_b_body: '', recipient_email: '',
      min_score: 0, last_open_days: 0, min_sample_size: 30, auto_promote: true,
    });
    setIsCreateOpen(false);
  };

  const calculateOpenRate = (opens: number, sends: number) => {
    if (sends === 0) return 0;
    return Math.round((opens / sends) * 100);
  };

  const calculateClickRate = (clicks: number, opens: number) => {
    if (opens === 0) return 0;
    return Math.round((clicks / opens) * 100);
  };

  const getWinnerVariant = (test: typeof tests[0]) => {
    const rateA = calculateOpenRate(test.variant_a_opens, test.variant_a_sends);
    const rateB = calculateOpenRate(test.variant_b_opens, test.variant_b_sends);
    
    if (test.variant_a_sends < 10 && test.variant_b_sends < 10) return null;
    if (rateA > rateB) return 'A';
    if (rateB > rateA) return 'B';
    return null;
  };

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Rascunho', variant: 'secondary' },
    running: { label: 'Em Execução', variant: 'default' },
    paused: { label: 'Pausado', variant: 'outline' },
    completed: { label: 'Concluído', variant: 'secondary' },
  };

  if (isLoading) {
    return (
      <div role="region" aria-label="ABTestingTab" className="space-y-6">
        <Card role="article">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card role="article">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Testes A/B
              </CardTitle>
              <CardDescription>
                Compare diferentes assuntos de email para otimizar taxas de abertura
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Teste
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Teste A/B</DialogTitle>
                  <DialogDescription>
                    Configure dois assuntos diferentes para testar qual tem melhor performance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Teste</Label>
                    <Input
                      placeholder="Ex: Teste Promoção Black Friday"
                      value={newTest.name}
                      onChange={e => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600">A</Badge>
                      Variante A - Assunto
                    </Label>
                    <Input
                      placeholder="Ex: 🔥 Oferta Imperdível - 50% OFF"
                      value={newTest.variant_a_subject}
                      onChange={e => setNewTest(prev => ({ ...prev, variant_a_subject: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600">B</Badge>
                      Variante B - Assunto
                    </Label>
                    <Input
                      placeholder="Ex: Só hoje: Metade do preço em tudo!"
                      value={newTest.variant_b_subject}
                      onChange={e => setNewTest(prev => ({ ...prev, variant_b_subject: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Corpo A (opcional)</Label>
                      <Textarea
                        rows={3}
                        placeholder="HTML/texto da variante A"
                        value={newTest.variant_a_body}
                        onChange={e => setNewTest(prev => ({ ...prev, variant_a_body: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Corpo B (opcional)</Label>
                      <Textarea
                        rows={3}
                        placeholder="HTML/texto da variante B"
                        value={newTest.variant_b_body}
                        onChange={e => setNewTest(prev => ({ ...prev, variant_b_body: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Segmentação comportamental (opcional)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Score mínimo (0-100)</Label>
                        <Input
                          type="number" min={0} max={100}
                          value={newTest.min_score}
                          onChange={e => setNewTest(prev => ({ ...prev, min_score: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Abriu nos últimos (dias)</Label>
                        <Input
                          type="number" min={0} max={365}
                          value={newTest.last_open_days}
                          onChange={e => setNewTest(prev => ({ ...prev, last_open_days: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Amostra mínima por variante</Label>
                      <Input
                        type="number" min={10} max={10000}
                        value={newTest.min_sample_size}
                        onChange={e => setNewTest(prev => ({ ...prev, min_sample_size: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Promover vencedor automaticamente</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={newTest.auto_promote}
                          onCheckedChange={v => setNewTest(prev => ({ ...prev, auto_promote: v }))}
                        />
                        <span className="text-xs text-muted-foreground">
                          Z-test 95% de confiança
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email de Teste (opcional)
                    </Label>
                    <Input
                      placeholder="teste@exemplo.com"
                      value={newTest.recipient_email}
                      onChange={e => setNewTest(prev => ({ ...prev, recipient_email: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleCreateTest}
                    className="w-full"
                    disabled={createTest.isPending}
                  >
                    {createTest.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Teste
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(!tests || tests.length === 0) ? (
            <EmptyState
              type="abtesting"
              title="Nenhum teste A/B criado"
              description="Compare diferentes assuntos de email para descobrir qual tem melhor performance e otimize suas taxas de abertura."
              action={
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Teste
                </Button>
              }
            />
          ) : (
            tests.map(test => {
              const openRateA = calculateOpenRate(test.variant_a_opens, test.variant_a_sends);
              const openRateB = calculateOpenRate(test.variant_b_opens, test.variant_b_sends);
              const clickRateA = calculateClickRate(test.variant_a_clicks, test.variant_a_opens);
              const clickRateB = calculateClickRate(test.variant_b_clicks, test.variant_b_opens);
              const suggestedWinner = getWinnerVariant(test);

              return (
                <Card key={test.id} className={test.status === 'running' ? 'border-primary/50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{test.name}</h4>
                          <Badge variant={statusLabels[test.status]?.variant || 'secondary'}>
                            {statusLabels[test.status]?.label}
                          </Badge>
                          {test.winner && (
                            <Badge className="bg-yellow-500/20 text-yellow-600">
                              <Trophy className="h-3 w-3 mr-1" />
                              Vencedor: {test.winner}
                            </Badge>
                          )}
                        </div>
                        {test.recipient_email && (
                          <p className="text-xs text-muted-foreground">
                            Testando com: {test.recipient_email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {test.status === 'draft' && (
                          <Button size="sm" onClick={() => startTest.mutate(test.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => pauseTest.mutate(test.id)}>
                              <Pause className="h-4 w-4 mr-1" />
                              Pausar
                            </Button>
                            {suggestedWinner && (
                              <Button 
                                size="sm" 
                                onClick={() => completeTest.mutate({ id: test.id, winner: suggestedWinner })}
                              >
                                <Trophy className="h-4 w-4 mr-1" />
                                Finalizar
                              </Button>
                            )}
                          </>
                        )}
                        {test.status === 'paused' && (
                          <Button size="sm" onClick={() => startTest.mutate(test.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Retomar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTest.mutate(test.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Variantes comparison */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Variant A */}
                      <div className={`p-4 rounded-lg border-2 ${
                        test.winner === 'A' ? 'border-green-500 bg-green-500/5' : 
                        suggestedWinner === 'A' && !test.winner ? 'border-blue-500/50 bg-blue-500/5' : 
                        'border-border bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                            Variante A
                          </Badge>
                          {test.winner === 'A' && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium mb-3 line-clamp-2">
                          "{test.variant_a_subject}"
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Envios: {test.variant_a_sends}</span>
                            <span>Aberturas: {test.variant_a_opens}</span>
                          </div>
                          <Progress value={openRateA} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Taxa de abertura: {openRateA}%</span>
                            <span>Cliques: {clickRateA}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Variant B */}
                      <div className={`p-4 rounded-lg border-2 ${
                        test.winner === 'B' ? 'border-green-500 bg-green-500/5' : 
                        suggestedWinner === 'B' && !test.winner ? 'border-purple-500/50 bg-purple-500/5' : 
                        'border-border bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                            Variante B
                          </Badge>
                          {test.winner === 'B' && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium mb-3 line-clamp-2">
                          "{test.variant_b_subject}"
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Envios: {test.variant_b_sends}</span>
                            <span>Aberturas: {test.variant_b_opens}</span>
                          </div>
                          <Progress value={openRateB} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Taxa de abertura: {openRateB}%</span>
                            <span>Cliques: {clickRateB}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats summary */}
                    {(test.variant_a_sends > 0 || test.variant_b_sends > 0) && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground text-center">
                          {test.status === 'running' && suggestedWinner && (
                            <>Variante <strong>{suggestedWinner}</strong> está com melhor performance ({suggestedWinner === 'A' ? openRateA : openRateB}% de abertura)</>
                          )}
                          {test.status === 'running' && !suggestedWinner && (
                            <>Aguardando mais dados para determinar vencedor (mínimo 10 envios por variante)</>
                          )}
                          {test.status === 'completed' && test.winner && (
                            <>Teste concluído! Variante <strong>{test.winner}</strong> foi a vencedora</>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card role="article">
        <CardHeader>
          <CardTitle className="text-base">Como funciona o Teste A/B</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl mb-2">1️⃣</div>
              <p className="font-medium">Crie o teste</p>
              <p className="text-xs text-muted-foreground">Defina dois assuntos diferentes</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl mb-2">2️⃣</div>
              <p className="font-medium">Envie emails</p>
              <p className="text-xs text-muted-foreground">Use os assuntos alternadamente</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl mb-2">3️⃣</div>
              <p className="font-medium">Acompanhe</p>
              <p className="text-xs text-muted-foreground">Monitore as métricas em tempo real</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-2xl mb-2">4️⃣</div>
              <p className="font-medium">Finalize</p>
              <p className="text-xs text-muted-foreground">Escolha o vencedor com base nos dados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const ABTestingTab = memo(ABTestingTabBase);
export default ABTestingTab;
