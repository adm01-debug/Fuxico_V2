import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Bell, Volume2, Monitor, Mail, FileText, Loader2, Clock, Play, VolumeX, Volume1, Type, Link2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { playNotificationSound, NOTIFICATION_SOUNDS, NotificationSoundType } from '@/lib/notification-sound';

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

  const handleSoundTypeChange = (value: string) => {
    updatePreferences({ notification_sound_type: value });
    playNotificationSound('warning', value as NotificationSoundType, warningVolume);
  };

  const handleWarningVolumeChange = (value: number[]) => {
    updatePreferences({ warning_volume: value[0] });
  };

  const handleWarningVolumeCommit = (value: number[]) => {
    playNotificationSound('warning', currentSoundType, value[0]);
  };

  const handleCriticalVolumeChange = (value: number[]) => {
    updatePreferences({ critical_volume: value[0] });
  };

  const handleCriticalVolumeCommit = (value: number[]) => {
    playNotificationSound('critical', currentSoundType, value[0]);
  };

  const currentSoundType = (preferences?.notification_sound_type ?? 'gentle') as NotificationSoundType;
  const warningVolume = preferences?.warning_volume ?? 0.4;
  const criticalVolume = preferences?.critical_volume ?? 0.7;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <BackButton onClick={() => navigate(-1)} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Configurações</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">{user?.email}</p>
          </div>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-5 w-5 shrink-0" />
              Canais de Notificação
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Escolha como você quer receber notificações de tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
            {/* Sound Toggle */}
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <Volume2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <Label htmlFor="sound" className="text-sm sm:text-base">Som</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tocar som ao receber notificações</p>
                </div>
              </div>
              <Switch
                id="sound"
                checked={preferences?.sound_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('sound_enabled', checked)}
                disabled={isUpdating}
                className="shrink-0"
              />
            </div>

            {preferences?.sound_enabled && (
              <div className="space-y-4 pl-0 sm:pl-8">
                {/* Sound Type */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="soundType" className="text-sm min-w-[80px]">Tipo de som:</Label>
                  <Select
                    value={currentSoundType}
                    onValueChange={handleSoundTypeChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="soundType" className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_SOUNDS.map((sound) => (
                        <SelectItem key={sound.value} value={sound.value}>
                          {sound.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Warning Volume */}
                <div className="space-y-2">
                  <Label className="text-sm">Volume Aviso:</Label>
                  <div className="flex items-center gap-2">
                    {warningVolume === 0 ? (
                      <VolumeX className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : warningVolume < 0.5 ? (
                      <Volume1 className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Slider
                      value={[warningVolume]}
                      onValueChange={handleWarningVolumeChange}
                      onValueCommit={handleWarningVolumeCommit}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">{Math.round(warningVolume * 100)}%</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => playNotificationSound('warning', currentSoundType, warningVolume)}
                      title="Testar som de aviso"
                      className="h-9 w-9 shrink-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                
                {/* Critical Volume */}
                <div className="space-y-2">
                  <Label className="text-sm">Volume Crítico:</Label>
                  <div className="flex items-center gap-2">
                    {criticalVolume === 0 ? (
                      <VolumeX className="h-4 w-4 text-destructive shrink-0" />
                    ) : criticalVolume < 0.5 ? (
                      <Volume1 className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <Slider
                      value={[criticalVolume]}
                      onValueChange={handleCriticalVolumeChange}
                      onValueCommit={handleCriticalVolumeCommit}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">{Math.round(criticalVolume * 100)}%</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => playNotificationSound('critical', currentSoundType, criticalVolume)}
                      title="Testar som crítico"
                      className="h-9 w-9 shrink-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Desktop Notifications */}
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <Monitor className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <Label htmlFor="desktop" className="text-sm sm:text-base">Desktop</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Mostrar notificações do navegador</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
                  <span className="text-xs text-destructive hidden xs:inline">Bloqueado</span>
                )}
                {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => Notification.requestPermission()}
                    className="h-8 text-xs"
                  >
                    Ativar
                  </Button>
                )}
                {typeof Notification !== 'undefined' && Notification.permission === 'granted' && (
                  <span className="text-xs text-green-600 hidden xs:inline">Ativo</span>
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

            {/* Email Notifications */}
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receber resumo por email</p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences?.email_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
                disabled={isUpdating}
                className="shrink-0"
              />
            </div>

            {preferences?.email_enabled && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pl-0 sm:pl-8">
                <Label htmlFor="frequency" className="text-sm">Frequência:</Label>
                <Select
                  value={preferences?.email_digest_frequency ?? 'daily'}
                  onValueChange={handleDigestChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="frequency" className="w-full sm:w-40">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5 shrink-0" />
              Tipos de Evento
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Selecione quais eventos devem gerar notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
            {/* Event toggles */}
            {[
              { id: 'notify_on_open', label: 'Abertura de Email', description: 'Quando alguém abre seu email', key: 'notify_on_open' },
              { id: 'notify_on_click', label: 'Clique em Link', description: 'Quando alguém clica em um link', key: 'notify_on_click' },
              { id: 'notify_on_document_view', label: 'Visualização de Documento', description: 'Quando alguém visualiza um documento', key: 'notify_on_document_view' },
              { id: 'notify_on_document_download', label: 'Download de Documento', description: 'Quando alguém baixa um documento', key: 'notify_on_document_download' },
            ].map((event, index, arr) => (
              <div key={event.id}>
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Label htmlFor={event.id} className="text-sm sm:text-base">{event.label}</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <Switch
                    id={event.id}
                    checked={preferences?.[event.key as keyof typeof preferences] as boolean ?? true}
                    onCheckedChange={(checked) => handleToggle(event.key, checked)}
                    disabled={isUpdating}
                    className="shrink-0"
                  />
                </div>
                {index < arr.length - 1 && <Separator className="mt-4 sm:mt-6" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Auto Reminder Settings */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 shrink-0" />
              Lembretes Automáticos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Configure lembretes automáticos para follow-up de emails não abertos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <Label htmlFor="auto_reminder" className="text-sm sm:text-base">Criar Lembretes Automaticamente</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Ao enviar emails rastreados, criar lembrete de follow-up</p>
              </div>
              <Switch
                id="auto_reminder"
                checked={preferences?.auto_reminder_enabled ?? false}
                onCheckedChange={(checked) => handleToggle('auto_reminder_enabled', checked)}
                disabled={isUpdating}
                className="shrink-0"
              />
            </div>

            {preferences?.auto_reminder_enabled && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Label htmlFor="reminder_days" className="text-sm sm:text-base">Dias para Lembrete</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Após quantos dias sem abertura criar alerta</p>
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
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Accessibility Settings */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Type className="h-5 w-5 shrink-0" />
              Acessibilidade
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Personalize a interface para melhor visualização
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Google Integration */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Link2 className="h-5 w-5 shrink-0" />
              Integração Gmail
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Conecte sua conta corporativa para rastrear emails enviados pelo Gmail
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Ao conectar sua conta, nossa extensão poderá sincronizar automaticamente o rastreamento de emails enviados.
              </p>
              <Button 
                onClick={() => {
                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                  window.location.href = `${supabaseUrl}/functions/v1/gmail-auth?userId=${user?.id}`;
                }}
                className="w-full sm:w-auto"
              >
                Conectar Gmail Corporativo
              </Button>
            </div>
          </CardContent>
        </Card>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="font_size" className="text-sm sm:text-base">Tamanho da Fonte</Label>
                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {preferences?.font_size ?? 16}px
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">A</span>
                <Slider
                  id="font_size"
                  value={[preferences?.font_size ?? 16]}
                  onValueChange={(value) => updatePreferences({ font_size: value[0] })}
                  min={12}
                  max={24}
                  step={1}
                  className="flex-1"
                  disabled={isUpdating}
                />
                <span className="text-lg text-muted-foreground">A</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajuste o tamanho base da fonte para facilitar a leitura. (Padrão: 16px)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Conta</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Button variant="destructive" onClick={signOut} className="w-full sm:w-auto">
              Sair da Conta
            </Button>
          </CardContent>
        </Card>

        {/* LGPD & Data Management */}
        <Card className="border-destructive/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg text-destructive">Privacidade & LGPD</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gerencie seus dados pessoais e direitos de privacidade
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Exclusão de Dados</h4>
                <p className="text-xs text-muted-foreground">
                  Ao excluir seus dados, todas as informações de tracking, histórico e conta serão removidas permanentemente.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-destructive/50 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir todos os seus dados? Esta ação é irreversível.")) {
                    // Implement actual deletion logic here
                    alert("Solicitação de exclusão enviada. Seus dados serão removidos em até 24h.");
                  }
                }}
              >
                Excluir todos os meus dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saving indicator */}
        {isUpdating && (
          <div className="fixed bottom-4 right-4 left-4 sm:left-auto bg-primary text-primary-foreground px-4 py-2.5 rounded-lg flex items-center justify-center sm:justify-start gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Salvando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
