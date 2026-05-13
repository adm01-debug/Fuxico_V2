import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  Pause, 
  MoreVertical, 
  Users, 
  CheckCircle, 
  MessageSquare,
  Trash2,
  Edit,
  Copy,
  Archive
} from 'lucide-react';
import { EmailSequence } from '@/features/sequences/hooks/useEmailSequences';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SequenceCardProps {
  sequence: EmailSequence;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: EmailSequence['status']) => void;
  onDelete: (id: string) => void;
  onDuplicate: (sequence: EmailSequence) => void;
}

const statusConfig: Record<EmailSequence['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'outline' },
  archived: { label: 'Arquivada', variant: 'destructive' },
};

const triggerConfig: Record<EmailSequence['trigger_type'], string> = {
  manual: 'Manual',
  on_open: 'Ao abrir',
  on_click: 'Ao clicar',
  on_no_response: 'Sem resposta',
};

export const SequenceCard = React.memo(function SequenceCard({
  sequence,
  onSelect,
  onStatusChange,
  onDelete,
  onDuplicate,
}: SequenceCardProps) {
  const status = statusConfig[sequence.status];
  const completionRate = sequence.total_enrolled > 0 
    ? Math.round((sequence.total_completed / sequence.total_enrolled) * 100) 
    : 0;
  const replyRate = sequence.total_enrolled > 0 
    ? Math.round((sequence.total_replied / sequence.total_enrolled) * 100) 
    : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(sequence.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{sequence.name}</CardTitle>
            {sequence.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {sequence.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant={status.variant}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onSelect(sequence.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(sequence)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {sequence.status === 'active' ? (
                  <DropdownMenuItem onClick={() => onStatusChange(sequence.id, 'paused')}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </DropdownMenuItem>
                ) : sequence.status !== 'archived' ? (
                  <DropdownMenuItem onClick={() => onStatusChange(sequence.id, 'active')}>
                    <Play className="mr-2 h-4 w-4" />
                    Ativar
                  </DropdownMenuItem>
                ) : null}
                {sequence.status !== 'archived' && (
                  <DropdownMenuItem onClick={() => onStatusChange(sequence.id, 'archived')}>
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(sequence.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <span>Gatilho: {triggerConfig[sequence.trigger_type]}</span>
          <span>•</span>
          <span>Criada {formatDistanceToNow(new Date(sequence.created_at), { addSuffix: true, locale: ptBR })}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{sequence.total_enrolled}</p>
              <p className="text-xs text-muted-foreground">Inscritos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Conclusão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">{replyRate}%</p>
              <p className="text-xs text-muted-foreground">Respostas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
