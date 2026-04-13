import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  Mail,
  Eye,
  MousePointer,
  Save,
  Plus
} from 'lucide-react';
import { SequenceStep, useCreateStep, useUpdateStep, useDeleteStep } from '@/hooks/useEmailSequences';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SequenceStepEditorProps {
  steps: SequenceStep[];
  sequenceId: string;
}

const triggerConditionLabels: Record<SequenceStep['trigger_condition'], { label: string; icon: React.ReactNode }> = {
  always: { label: 'Sempre enviar', icon: <Mail className="h-4 w-4" /> },
  if_not_opened: { label: 'Se não abriu anterior', icon: <Eye className="h-4 w-4" /> },
  if_not_clicked: { label: 'Se não clicou', icon: <MousePointer className="h-4 w-4" /> },
  if_opened: { label: 'Se abriu anterior', icon: <Eye className="h-4 w-4" /> },
  if_clicked: { label: 'Se clicou', icon: <MousePointer className="h-4 w-4" /> },
};

interface StepFormData {
  subject: string;
  body: string;
  delay_days: number;
  delay_hours: number;
  trigger_condition: SequenceStep['trigger_condition'];
  is_active: boolean;
}

function StepCard({ 
  step, 
  index, 
    onDelete 
}: { 
  step: SequenceStep; 
  index: number;
  sequenceId: string;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<StepFormData>({
    subject: step.subject,
    body: step.body,
    delay_days: step.delay_days,
    delay_hours: step.delay_hours,
    trigger_condition: step.trigger_condition,
    is_active: step.is_active,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateStep = useUpdateStep();

  const handleChange = <K extends keyof StepFormData>(key: K, value: StepFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateStep.mutateAsync({ id: step.id, ...formData });
    setHasChanges(false);
  };

  const condition = triggerConditionLabels[step.trigger_condition];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`transition-all ${!step.is_active ? 'opacity-60' : ''}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <CardTitle className="text-base">{step.subject}</CardTitle>
                  {!step.is_active && (
                    <Badge variant="secondary">Desativada</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.delay_days}d {step.delay_hours}h após anterior
                  </span>
                  <span className="flex items-center gap-1">
                    {condition.icon}
                    {condition.label}
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias após etapa anterior</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.delay_days}
                  onChange={(e) => handleChange('delay_days', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horas adicionais</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={formData.delay_hours}
                  onChange={(e) => handleChange('delay_hours', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Condição de Envio</Label>
              <Select 
                value={formData.trigger_condition} 
                onValueChange={(v) => handleChange('trigger_condition', v as SequenceStep['trigger_condition'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre enviar</SelectItem>
                  <SelectItem value="if_not_opened">Se não abriu o anterior</SelectItem>
                  <SelectItem value="if_opened">Se abriu o anterior</SelectItem>
                  <SelectItem value="if_not_clicked">Se não clicou</SelectItem>
                  <SelectItem value="if_clicked">Se clicou em algum link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto do Email</Label>
              <Input
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Ex: Re: {{subject_original}}"
              />
              <p className="text-xs text-muted-foreground">
                Variáveis: {'{{name}}'}, {'{{email}}'}, {'{{company}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Corpo do Email</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Escreva o conteúdo do email..."
                rows={6}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
                <Label>Etapa ativa</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
                {hasChanges && (
                  <Button size="sm" onClick={handleSave} disabled={updateStep.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function SequenceStepEditor({ steps, sequenceId }: SequenceStepEditorProps) {
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<StepFormData>({
    subject: '',
    body: '',
    delay_days: 1,
    delay_hours: 0,
    trigger_condition: 'always',
    is_active: true,
  });

  const createStep = useCreateStep();
  const deleteStep = useDeleteStep();

  const handleAddStep = async () => {
    await createStep.mutateAsync({
      sequence_id: sequenceId,
      step_order: steps.length + 1,
      ...newStep,
    });
    setNewStep({
      subject: '',
      body: '',
      delay_days: 1,
      delay_hours: 0,
      trigger_condition: 'always',
      is_active: true,
    });
    setIsAddingStep(false);
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteStep.mutateAsync({ id: stepId, sequenceId });
  };

  return (
    <div className="space-y-4">
      {steps.length === 0 && !isAddingStep && (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma etapa configurada</h3>
          <p className="text-muted-foreground mb-4">
            Adicione etapas para criar sua sequência de follow-up automatizado.
          </p>
          <Button onClick={() => setIsAddingStep(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeira Etapa
          </Button>
        </Card>
      )}

      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          index={index}
          sequenceId={sequenceId}
          onDelete={() => handleDeleteStep(step.id)}
        />
      ))}

      {isAddingStep ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {steps.length + 1}
              </Badge>
              Nova Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias após etapa anterior</Label>
                <Input
                  type="number"
                  min={0}
                  value={newStep.delay_days}
                  onChange={(e) => setNewStep(prev => ({ ...prev, delay_days: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Horas adicionais</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newStep.delay_hours}
                  onChange={(e) => setNewStep(prev => ({ ...prev, delay_hours: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Condição de Envio</Label>
              <Select 
                value={newStep.trigger_condition} 
                onValueChange={(v) => setNewStep(prev => ({ ...prev, trigger_condition: v as SequenceStep['trigger_condition'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre enviar</SelectItem>
                  <SelectItem value="if_not_opened">Se não abriu o anterior</SelectItem>
                  <SelectItem value="if_opened">Se abriu o anterior</SelectItem>
                  <SelectItem value="if_not_clicked">Se não clicou</SelectItem>
                  <SelectItem value="if_clicked">Se clicou em algum link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assunto do Email</Label>
              <Input
                value={newStep.subject}
                onChange={(e) => setNewStep(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ex: Re: Proposta Comercial"
              />
            </div>

            <div className="space-y-2">
              <Label>Corpo do Email</Label>
              <Textarea
                value={newStep.body}
                onChange={(e) => setNewStep(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Escreva o conteúdo do email..."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingStep(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddStep} 
                disabled={!newStep.subject || !newStep.body || createStep.isPending}
              >
                Adicionar Etapa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : steps.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => setIsAddingStep(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      )}
    </div>
  );
}
