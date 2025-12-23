import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell, Volume2, Monitor, Mail, FileText, Loader2, Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { playNotificationSound, playSuccessSound } from '@/lib/notification-sound';

export default function Settings() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useUserPreferences();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleDigestChange = (value: string) => {
    updatePreferences({ email_digest_frequency: value });
  };

  const handleReminderDaysChange = (value: string) => {
    const days = parseInt(value, 10);
    if (!isNaN(days) && days >= 1 && days <= 30) {
      updatePreferences({ auto_reminder_days: days });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Canais de Notificação
            </CardTitle>
            <CardDescription>
              Escolha como você quer receber notificações de tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sound" className="text-base">Som</Label>
                  <p className="text-sm text-muted-foreground">Tocar som ao receber notificações</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playNotificationSound('warning')}
                  title="Testar som de aviso"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Aviso
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playNotificationSound('critical')}
                  title="Testar som crítico"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Crítico
                </Button>
                <Switch
                  id="sound"
                  checked={preferences?.sound_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle('sound_enabled', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="desktop" className="text-base">Desktop</Label>
                  <p className="text-sm text-muted-foreground">Mostrar notificações do navegador</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
                  <span className="text-xs text-destructive">Bloqueado</span>
                )}
                {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => Notification.requestPermission()}
                  >
                    Ativar
                  </Button>
                )}
                {typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
                  <span className="text-xs text-green-600">Ativo</span>
                )}
                <Switch
                  id="desktop"
                  checked={preferences?.desktop_enabled ?? true}
                  onCheckedChange={(checked) => handleToggle('desktop_enabled', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <p className="text-sm text-muted-foreground">Receber resumo por email</p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences?.email_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
                disabled={isUpdating}
              />
            </div>

            {preferences?.email_enabled && (
              <div className="ml-8 flex items-center gap-4">
                <Label htmlFor="frequency" className="text-sm">Frequência:</Label>
                <Select
                  value={preferences?.email_digest_frequency ?? 'daily'}
                  onValueChange={handleDigestChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="frequency" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Tempo real</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tipos de Evento
            </CardTitle>
            <CardDescription>
              Selecione quais eventos devem gerar notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_open" className="text-base">Abertura de Email</Label>
                <p className="text-sm text-muted-foreground">Quando alguém abre seu email</p>
              </div>
              <Switch
                id="notify_open"
                checked={preferences?.notify_on_open ?? true}
                onCheckedChange={(checked) => handleToggle('notify_on_open', checked)}
                disabled={isUpdating}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_click" className="text-base">Clique em Link</Label>
                <p className="text-sm text-muted-foreground">Quando alguém clica em um link</p>
              </div>
              <Switch
                id="notify_click"
                checked={preferences?.notify_on_click ?? true}
                onCheckedChange={(checked) => handleToggle('notify_on_click', checked)}
                disabled={isUpdating}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_doc_view" className="text-base">Visualização de Documento</Label>
                <p className="text-sm text-muted-foreground">Quando alguém visualiza um documento</p>
              </div>
              <Switch
                id="notify_doc_view"
                checked={preferences?.notify_on_document_view ?? true}
                onCheckedChange={(checked) => handleToggle('notify_on_document_view', checked)}
                disabled={isUpdating}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_doc_download" className="text-base">Download de Documento</Label>
                <p className="text-sm text-muted-foreground">Quando alguém baixa um documento</p>
              </div>
              <Switch
                id="notify_doc_download"
                checked={preferences?.notify_on_document_download ?? true}
                onCheckedChange={(checked) => handleToggle('notify_on_document_download', checked)}
                disabled={isUpdating}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lembretes Automáticos
            </CardTitle>
            <CardDescription>
              Configure lembretes automáticos para follow-up de emails não abertos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_reminder" className="text-base">Criar Lembretes Automaticamente</Label>
                <p className="text-sm text-muted-foreground">Ao enviar emails rastreados, criar lembrete de follow-up</p>
              </div>
              <Switch
                id="auto_reminder"
                checked={preferences?.auto_reminder_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('auto_reminder_enabled', checked)}
                disabled={isUpdating}
              />
            </div>

            {preferences?.auto_reminder_enabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reminder_days" className="text-base">Dias para Lembrete</Label>
                    <p className="text-sm text-muted-foreground">Após quantos dias sem abertura criar alerta</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="reminder_days"
                      type="number"
                      min={1}
                      max={30}
                      value={preferences?.auto_reminder_days ?? 3}
                      onChange={(e) => handleReminderDaysChange(e.target.value)}
                      disabled={isUpdating}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={signOut}>
              Sair da Conta
            </Button>
          </CardContent>
        </Card>

        {isUpdating && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </div>
        )}
      </div>
    </div>
  );
}
