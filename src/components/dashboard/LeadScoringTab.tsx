// =============================================================================
// FUXICO - Lead Scoring Tab Component
// =============================================================================

import { useState } from 'react';
import { useContactScores, useRecalculateScores, ContactScore } from '@/hooks/use-lead-scoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { ContactHistoryDialog } from './ContactHistoryDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Loader2, 
  RefreshCw, 
  Flame, 
  ThermometerSun, 
  Snowflake, 
  Search,
  TrendingUp,
  Mail,
  MousePointerClick,
  Eye,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SCORE_CONFIG = {
  hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Quente' },
  warm: { icon: ThermometerSun, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Morno' },
  cool: { icon: ThermometerSun, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Frio' },
  cold: { icon: Snowflake, color: 'text-blue-600', bg: 'bg-blue-600/10', border: 'border-blue-600/20', label: 'Gelado' },
};

function ScoreBadge({ level }: { level: ContactScore['score_level'] }) {
  const config = SCORE_CONFIG[level];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} ${config.border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function LeadScoringTab() {
  const { data: contacts, isLoading, refetch } = useContactScores();
  const recalculate = useRecalculateScores();
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const handleRecalculate = async () => {
    try {
      const count = await recalculate.mutateAsync();
      toast({ 
        title: 'Scores recalculados', 
        description: `${count} contatos atualizados com sucesso` 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao recalcular', 
        description: 'Não foi possível recalcular os scores', 
        variant: 'destructive' 
      });
    }
  };

  const filteredContacts = contacts?.filter(c => 
    c.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Stats summary
  const stats = {
    hot: filteredContacts.filter(c => c.score_level === 'hot').length,
    warm: filteredContacts.filter(c => c.score_level === 'warm').length,
    cool: filteredContacts.filter(c => c.score_level === 'cool').length,
    cold: filteredContacts.filter(c => c.score_level === 'cold').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div role="region" aria-label="LeadScoringTab" className="space-y-6">
      {/* Header */}
      <div role="region" aria-label="LeadScoringTab" className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Lead Scoring
          </h2>
          <p className="text-muted-foreground">
            Pontuação de contatos baseada em engajamento
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleRecalculate} disabled={recalculate.isPending}>
            {recalculate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recalcular Todos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div role="region" aria-label="LeadScoringTab" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Quentes" value={stats.hot} color="bg-red-500/10 text-red-500" />
        <StatCard icon={ThermometerSun} label="Mornos" value={stats.warm} color="bg-orange-500/10 text-orange-500" />
        <StatCard icon={ThermometerSun} label="Frios" value={stats.cool} color="bg-blue-400/10 text-blue-400" />
        <StatCard icon={Snowflake} label="Gelados" value={stats.cold} color="bg-blue-600/10 text-blue-600" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar contato por email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts Table */}
      <Card role="article">
        <CardHeader>
          <CardTitle>Contatos ({filteredContacts.length})</CardTitle>
          <CardDescription>
            Score calculado por: aberturas (40pts) + cliques (40pts) + recência (20pts) - bounces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <EmptyState
              type="leads"
              title="Nenhum contato encontrado"
              description='Clique em "Recalcular Todos" para gerar scores baseados no engajamento.'
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead className="text-center">
                    <Mail className="h-4 w-4 inline" />
                    <Mail className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Eye className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">
                    <MousePointerClick className="h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>Última Interação</TableHead>
                  <TableHead className="text-center">Histórico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedContact(contact.email)}>
                    <TableCell className="font-medium">{contact.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={contact.engagement_score} className="w-16 h-2" />
                        <span className="text-sm font-medium">{contact.engagement_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge level={contact.score_level} />
                    </TableCell>
                    <TableCell className="text-center">{contact.total_emails_sent}</TableCell>
                    <TableCell className="text-center">{contact.unique_opens}</TableCell>
                    <TableCell className="text-center">{contact.total_clicks}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contact.last_interaction_at 
                        ? format(new Date(contact.last_interaction_at), "dd/MM/yyyy", { locale: ptBR })
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); setSelectedContact(contact.email); }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contact History Dialog */}
      <ContactHistoryDialog 
        email={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      />
    </div>
  );
}
