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
  Plus,
} from 'lucide-react';
import {
  SequenceStep,
  useCreateStep,
  useUpdateStep,
  useDeleteStep,
} from '@/features/sequences/hooks/useEmailSequences';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/navigation/UnsavedChangesDialog';

interface SequenceStepEditorProps {
  steps: SequenceStep[];
  sequenceId: string;
}

const triggerConditionLabels: Record<
  SequenceStep['trigger_condition'],
  { label: string; icon: React.ReactNode }
> = {
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

const EMPTY_STEP: StepFormData = {
  subject: '',
  body: '',
  delay_days: 1,
  delay_hours: 0,
  trigger_condition: 'always',
  is_active: true,
};

type StepFormField = keyof StepFormData;

const STEP_FIELDS: StepFormField[] = [
  'subject',
  'body',
  'delay_days',
  'delay_hours',
  'trigger_condition',
  'is_active',
];

function stepToFormData(step: SequenceStep): StepFormData {
  return {
    subject: step.subject,
    body: step.body,
    delay_days: step.delay_days,
    delay_hours: step.delay_hours,
    trigger_condition: step.trigger_condition,
    is_active: step.is_active,
  };
}

function formDataDiffers(current: StepFormData, baseline: StepFormData): boolean {
  return STEP_FIELDS.some((field) => current[field] !== baseline[field]);
}

function StepCard({
  step,
  index,
  onDelete,
}: {
  step: SequenceStep;
  index: number;
  sequenceId: string;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<StepFormData>(() => stepToFormData(step));
  const guard = useUnsavedChanges({
    when: isOpen && formDataDiffers(formData, stepToFormData(step)),
  });

  const updateStep = useUpdateStep();

  const handleChange = <K extends keyof StepFormData>(key: K, value: StepFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateStep.mutateAsync({ id: step.id, ...formData });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      guard.confirmClose(() => {
        setFormData(stepToFormData(step));
        setIsOpen(false);
      });
      return;
    }
    setIsOpen(true);
  };

  const handleDeleteClick = () => {
    guard.confirmClose(onDelete);
  };

  const hasChanges = formDataDiffers(formData, stepToFormData(step));
  const condition = triggerConditionLabels[step.trigger_condition];

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <Card className={`transition-all ${!step.is_active ? 'opacity-60' : ''}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {index + 1}
                  </Badge>
                  <CardTitle className="text-base">{step.subject}</CardTitle>
                  {!step.is_active && <Badge variant="secondary">Desativada</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
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
          <CardContent className="space-y-4 pt-0">
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
                onValueChange={(v) =>
                  handleChange('trigger_condition', v as SequenceStep['trigger_condition'])
                }
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
                <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remover
                </Button>
                {hasChanges && (
                  <Button size="sm" onClick={handleSave} disabled={updateStep.isPending}>
                    <Save className="mr-1 h-4 w-4" />
                    Salvar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <UnsavedChangesDialog
        open={guard.isBlocked}
        onConfirm={guard.discard}
        onCancel={guard.keepEditing}
        description="Esta etapa tem alterações que ainda não foram salvas. Se fechar agora, elas serão perdidas."
        confirmLabel="Descartar alterações"
      />
    </Collapsible>
  );
}

export function SequenceStepEditor({ steps, sequenceId }: SequenceStepEditorProps) {
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<StepFormData>(EMPTY_STEP);
  const newStepGuard = useUnsavedChanges({
    when: isAddingStep && formDataDiffers(newStep, EMPTY_STEP),
  });

  const createStep = useCreateStep();
  const deleteStep = useDeleteStep();

  const cancelAddStep = () => {
    newStepGuard.confirmClose(() => {
      setNewStep(EMPTY_STEP);
      setIsAddingStep(false);
    });
  };

  const handleAddStep = async () => {
    await createStep.mutateAsync({
      sequence_id: sequenceId,
      step_order: steps.length + 1,
      ...newStep,
    });
    setNewStep(EMPTY_STEP);
    setIsAddingStep(false);
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteStep.mutateAsync({ id: stepId, sequenceId });
  };

  return (
    <div className="space-y-4">
      {steps.length === 0 && !isAddingStep && (
        <Card className="p-8 text-center">
          <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">Nenhuma etapa configurada</h3>
          <p className="mb-4 text-muted-foreground">
            Adicione etapas para criar sua sequência de follow-up automatizado.
          </p>
          <Button onClick={() => setIsAddingStep(true)}>
            <Plus className="mr-2 h-4 w-4" />
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
            <CardTitle className="flex items-center gap-2 text-base">
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
                  onChange={(e) =>
                    setNewStep((prev) => ({ ...prev, delay_days: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Horas adicionais</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newStep.delay_hours}
                  onChange={(e) =>
                    setNewStep((prev) => ({ ...prev, delay_hours: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Condição de Envio</Label>
              <Select
                value={newStep.trigger_condition}
                onValueChange={(v) =>
                  setNewStep((prev) => ({
                    ...prev,
                    trigger_condition: v as SequenceStep['trigger_condition'],
                  }))
                }
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
                onChange={(e) => setNewStep((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Ex: Re: Proposta Comercial"
              />
            </div>

            <div className="space-y-2">
              <Label>Corpo do Email</Label>
              <Textarea
                value={newStep.body}
                onChange={(e) => setNewStep((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Escreva o conteúdo do email..."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelAddStep}>
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
      ) : (
        steps.length > 0 && (
          <Button variant="outline" className="w-full" onClick={() => setIsAddingStep(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Etapa
          </Button>
        )
      )}

      <UnsavedChangesDialog
        open={newStepGuard.isBlocked}
        onConfirm={newStepGuard.discard}
        onCancel={newStepGuard.keepEditing}
        description="A nova etapa tem conteúdo que ainda não foi adicionado. Se cancelar agora, ele será perdido."
      />
    </div>
  );
}
