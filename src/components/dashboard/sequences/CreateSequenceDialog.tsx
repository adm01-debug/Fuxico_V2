import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmailSequence, useCreateSequence } from '@/hooks/useEmailSequences';
import { Loader2 } from 'lucide-react';

interface CreateSequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (sequence: EmailSequence) => void;
}

export function CreateSequenceDialog({ open, onOpenChange, onSuccess }: CreateSequenceDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<EmailSequence['trigger_type']>('manual');

  const createSequence = useCreateSequence();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sequence = await createSequence.mutateAsync({
        name,
        description: description || undefined,
        trigger_type: triggerType,
      });
      
      setName('');
      setDescription('');
      setTriggerType('manual');
      onOpenChange(false);
      onSuccess?.(sequence);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Sequência de Email</DialogTitle>
          <DialogDescription>
            Crie uma sequência automatizada de follow-ups baseada em comportamento do destinatário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Sequência</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Follow-up Propostas"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo desta sequência..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trigger">Tipo de Gatilho</Label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as EmailSequence['trigger_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual - Inscrever contatos manualmente</SelectItem>
                  <SelectItem value="on_no_response">Sem resposta - Quando não houver abertura</SelectItem>
                  <SelectItem value="on_open">Ao abrir - Após email ser aberto</SelectItem>
                  <SelectItem value="on_click">Ao clicar - Após clique em link</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define quando os contatos serão automaticamente inscritos na sequência.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name || createSequence.isPending}>
              {createSequence.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Sequência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
