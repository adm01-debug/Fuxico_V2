import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Settings, 
  Users, 
  Mail,
  BarChart3,
  Save,
  Loader2
} from 'lucide-react';
import { EmailSequence, useSequenceDetail, useUpdateSequence } from '@/hooks/useEmailSequences';
import { SequenceStepEditor } from './SequenceStepEditor';
import { SequenceEnrollments } from './SequenceEnrollments';
import { Skeleton } from '@/components/ui/skeleton';

interface SequenceDetailProps {
  sequenceId: string;
  onBack: () => void;
}

const statusConfig: Record<EmailSequence['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'outline' },
  archived: { label: 'Arquivada', variant: 'destructive' },
};

export function SequenceDetail({ sequenceId, onBack }: SequenceDetailProps) {
  const { data, isLoading } = useSequenceDetail(sequenceId);
  const updateSequence = useUpdateSequence();
  
  const [settings, setSettings] = useState<EmailSequence['settings'] | null>(null);
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false);

  // Initialize settings when data loads
  React.useEffect(() => {
    if (data?.sequence.settings && !settings) {
      setSettings(data.sequence.settings);
    }
  }, [data, settings]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sequência não encontrada</p>
        <Button variant="link" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  const { sequence, steps, enrollments } = data;
  const status = statusConfig[sequence.status];

  const handleStatusToggle = async () => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    await updateSequence.mutateAsync({ id: sequence.id, status: newStatus });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    await updateSequence.mutateAsync({ id: sequence.id, settings });
    setHasSettingsChanges(false);
  };

  const updateSettings = <K extends keyof EmailSequence['settings']>(
    key: K, 
    value: EmailSequence['settings'][K]
  ) => {
    if (!settings) return;
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setHasSettingsChanges(true);
  };

  const completionRate = sequence.total_enrolled > 0 
    ? Math.round((sequence.total_completed / sequence.total_enrolled) * 100) 
    : 0;
  const replyRate = sequence.total_enrolled > 0 
    ? Math.round((sequence.total_replied / sequence.total_enrolled) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{sequence.name}</h2>
            {sequence.description && (
              <p className="text-muted-foreground">{sequence.description}</p>
            )}
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {sequence.status !== 'archived' && (
            <Button
              variant={sequence.status === 'active' ? 'outline' : 'default'}
              onClick={handleStatusToggle}
              disabled={updateSequence.isPending || steps.length === 0}
            >
              {updateSequence.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : sequence.status === 'active' ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {sequence.status === 'active' ? 'Pausar' : 'Ativar'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Etapas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{steps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Inscritos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{sequence.total_enrolled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conclusão</span>
            </div>
            <p className="text-2xl font-bold mt-1">{completionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Respostas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{replyRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps" className="gap-2">
            <Mail className="h-4 w-4" />
            Etapas ({steps.length})
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="gap-2">
            <Users className="h-4 w-4" />
            Inscritos ({enrollments.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-4">
          <SequenceStepEditor steps={steps} sequenceId={sequenceId} />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <SequenceEnrollments 
            enrollments={enrollments} 
            sequenceId={sequenceId}
            totalSteps={steps.length}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário de Início</Label>
                    <Select
                      value={String(settings.send_hours_start)}
                      onValueChange={(v) => updateSettings('send_hours_start', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Emails só serão enviados a partir deste horário
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Horário de Término</Label>
                    <Select
                      value={String(settings.send_hours_end)}
                      onValueChange={(v) => updateSettings('send_hours_end', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Emails só serão enviados até este horário
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(v) => updateSettings('timezone', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enviar nos finais de semana</Label>
                    <p className="text-sm text-muted-foreground">
                      Se desativado, emails agendados para sábado/domingo serão enviados na segunda-feira
                    </p>
                  </div>
                  <Switch
                    checked={settings.send_on_weekends}
                    onCheckedChange={(checked) => updateSettings('send_on_weekends', checked)}
                  />
                </div>

                {hasSettingsChanges && (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={updateSequence.isPending}>
                      {updateSequence.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
