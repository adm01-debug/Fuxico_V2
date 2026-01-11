import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Mail, Loader2, Play, Users, Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmailSequences, useUpdateSequence, useDeleteSequence, useCreateSequence, EmailSequence } from '@/hooks/useEmailSequences';
import { SequenceCard } from './sequences/SequenceCard';
import { SequenceDetail } from './sequences/SequenceDetail';
import { CreateSequenceDialog } from './sequences/CreateSequenceDialog';
import { SequenceStatsChart } from './sequences/SequenceStatsChart';
import { SequenceWebhookLogs } from './sequences/SequenceWebhookLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from './ConfirmDialog';

function SequencesTabBase() {
  const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: sequences, isLoading, refetch } = useEmailSequences();
  const updateSequence = useUpdateSequence();
  const deleteSequence = useDeleteSequence();
  const createSequence = useCreateSequence();

  const handleStatusChange = useCallback(async (id: string, status: EmailSequence['status']) => {
    await updateSequence.mutateAsync({ id, status });
  }, [updateSequence]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteSequence.mutateAsync(deleteId);
    setDeleteId(null);
  }, [deleteId, deleteSequence]);

  const handleDuplicate = useCallback(async (sequence: EmailSequence) => {
    await createSequence.mutateAsync({
      name: `${sequence.name} (cópia)`,
      description: sequence.description || undefined,
      trigger_type: sequence.trigger_type,
    });
  }, [createSequence]);

  const handleSequenceCreated = useCallback((sequence: EmailSequence) => {
    setSelectedSequenceId(sequence.id);
  }, []);

  const handleProcessSequences = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-sequences');
      
      if (error) throw error;
      
      toast.success(`Processamento concluído: ${data?.processed || 0} emails enviados`);
      refetch();
    } catch (error) {
      console.error('Erro ao processar sequências:', error);
      toast.error('Erro ao processar sequências');
    } finally {
      setIsProcessing(false);
    }
  }, [refetch]);

  // Calculate aggregate stats
  const stats = useMemo(() => {
    if (!sequences || sequences.length === 0) {
      return { totalEnrolled: 0, totalCompleted: 0, totalReplied: 0, replyRate: 0 };
    }
    
    const totalEnrolled = sequences.reduce((sum, seq) => sum + (seq.total_enrolled || 0), 0);
    const totalCompleted = sequences.reduce((sum, seq) => sum + (seq.total_completed || 0), 0);
    const totalReplied = sequences.reduce((sum, seq) => sum + (seq.total_replied || 0), 0);
    const replyRate = totalEnrolled > 0 ? (totalReplied / totalEnrolled) * 100 : 0;
    
    return { totalEnrolled, totalCompleted, totalReplied, replyRate };
  }, [sequences]);

  // Filter sequences
  const filteredSequences = sequences?.filter(seq => {
    const matchesSearch = seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (seq.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || seq.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Show detail view if a sequence is selected
  if (selectedSequenceId) {
    return (
      <SequenceDetail 
        sequenceId={selectedSequenceId} 
        onBack={() => setSelectedSequenceId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sequências de Email</h2>
          <p className="text-muted-foreground">
            Crie fluxos de follow-up automatizados baseados em comportamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleProcessSequences}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Processar Agora
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sequência
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Inscritos</p>
                <p className="text-2xl font-bold">{stats.totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emails Completos</p>
                <p className="text-2xl font-bold">{stats.totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                <p className="text-2xl font-bold">{stats.replyRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Chart */}
      <SequenceStatsChart />

      {/* Webhook Execution Logs */}
      <SequenceWebhookLogs />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sequências..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="archived">Arquivada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sequences Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredSequences.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {sequences?.length === 0 
              ? 'Nenhuma sequência criada' 
              : 'Nenhuma sequência encontrada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {sequences?.length === 0 
              ? 'Crie sua primeira sequência de email automatizada para aumentar suas taxas de resposta.'
              : 'Tente ajustar os filtros de busca.'}
          </p>
          {sequences?.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Sequência
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSequences.map((sequence) => (
            <SequenceCard
              key={sequence.id}
              sequence={sequence}
              onSelect={setSelectedSequenceId}
              onStatusChange={handleStatusChange}
              onDelete={setDeleteId}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateSequenceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleSequenceCreated}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Sequência"
        description="Tem certeza que deseja excluir esta sequência? Todos os dados de inscrições e histórico serão perdidos."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export const SequencesTab = React.memo(SequencesTabBase);
export default SequencesTab;
