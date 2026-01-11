import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIInsights, useRefreshInsights } from '@/hooks/use-ai-insights';
import { 
  Brain, 
  RefreshCw, 
  Clock, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

function InsightsTabBase() {
  const { data, isLoading, error, refetch } = useAIInsights();
  const refreshMutation = useRefreshInsights();

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
      refetch();
      toast.success('Insights atualizados com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar insights');
    }
  };

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div role="region" aria-label="InsightsTab" className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">Erro ao carregar insights: {error.message}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;
  const insights = data?.insights || '';

  // Parse insights into sections
  const sections = parseInsights(insights);

  return (
    <div role="region" aria-label="InsightsTab" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Insights com IA</h2>
            <p className="text-muted-foreground">Análise inteligente dos seus padrões de engajamento</p>
          </div>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Atualizar Análise
        </Button>
      </div>

      {/* Stats Cards */}
      <div role="region" aria-label="InsightsTab" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total de Emails"
          value={stats?.totalEmails || 0}
          icon={<BarChart3 className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard 
          title="Taxa de Abertura"
          value={`${stats?.openRate || 0}%`}
          icon={<Target className="h-5 w-5" />}
          color="green"
        />
        <StatsCard 
          title="Taxa de Cliques"
          value={`${stats?.clickRate || 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard 
          title="Eventos Analisados"
          value={stats?.totalEvents || 0}
          icon={<Zap className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Best Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card role="article">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Melhores Horários
            </CardTitle>
            <CardDescription>Horários com maior engajamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.bestHours && stats.bestHours.length > 0 ? (
                stats.bestHours.map((h, i) => (
                  <div key={h.hour} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={i === 0 ? 'default' : 'secondary'}>
                        #{i + 1}
                      </Badge>
                      <span className="font-medium">{h.hour}:00</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{h.opens} aberturas</span>
                      <span>{h.clicks} cliques</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Dados insuficientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card role="article">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Melhores Dias
            </CardTitle>
            <CardDescription>Dias da semana com maior engajamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.bestDays && stats.bestDays.length > 0 ? (
                stats.bestDays.map((d, i) => (
                  <div key={d.day} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={i === 0 ? 'default' : 'secondary'}>
                        #{i + 1}
                      </Badge>
                      <span className="font-medium">{d.dayName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{d.opens} aberturas</span>
                      <span>{d.clicks} cliques</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Dados insuficientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise Inteligente
          </CardTitle>
          <CardDescription>Recomendações personalizadas baseadas nos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section, i) => (
                  <div key={i} className="p-4 bg-background/50 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">{section.title}</h4>
                    <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-line text-muted-foreground">{insights}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <Card role="article">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="h-14 w-full" />
              ))}
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
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function parseInsights(text: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];
  
  const patterns = [
    /(?:^|\n)(?:\*\*)?(\d+\.\s*)?(?:MELHOR HORÁRIO|MELHORES HORÁRIOS?)(?:\*\*)?[:\s]*([\s\S]*?)(?=(?:\n(?:\*\*)?(?:\d+\.\s*)?(?:PADRÕES|SUGESTÕES|ALERTA|$)))/i,
    /(?:^|\n)(?:\*\*)?(\d+\.\s*)?(?:PADRÕES DE ENGAJAMENTO|PADRÕES?)(?:\*\*)?[:\s]*([\s\S]*?)(?=(?:\n(?:\*\*)?(?:\d+\.\s*)?(?:SUGESTÕES|ALERTA|$)))/i,
    /(?:^|\n)(?:\*\*)?(\d+\.\s*)?(?:SUGESTÕES DE MELHORIA|SUGESTÕES?)(?:\*\*)?[:\s]*([\s\S]*?)(?=(?:\n(?:\*\*)?(?:\d+\.\s*)?(?:ALERTA|$)))/i,
    /(?:^|\n)(?:\*\*)?(\d+\.\s*)?(?:ALERTA|ALERTAS?)(?:\*\*)?[:\s]*([\s\S]*?)$/i,
  ];

  const titles = ['Melhor Horário', 'Padrões de Engajamento', 'Sugestões de Melhoria', 'Alertas'];

  patterns.forEach((pattern, i) => {
    const match = text.match(pattern);
    if (match && match[2]?.trim()) {
      sections.push({
        title: titles[i],
        content: match[2].trim()
      });
    }
  });

  return sections;
}

export const InsightsTab = memo(InsightsTabBase);
export default InsightsTab;
