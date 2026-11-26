// =============================================================================
// FUXICO - Central de Notificacoes Push (dados reais)
// =============================================================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MousePointerClick,
  FileText,
  Download,
  Clock,
  CheckCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { matchFirst } from '@/lib/variant';
import { useDesktopNotifications } from '@/hooks/use-desktop-notifications';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import {
  useMarkAllPushNotificationsRead,
  useMarkPushNotificationRead,
  usePushNotifications,
  useSendPushNotification,
  type PushNotification,
} from '@/hooks/use-push-notifications';
import { computePushNotificationStats } from '@/lib/push-notification-stats';

type PreferenceKey =
  'notify_on_open' | 'notify_on_click' | 'notify_on_document_view' | 'notify_on_document_download';

const NOTIFICATION_TYPES: {
  key: PreferenceKey;
  label: string;
  description: string;
  icon: typeof Eye;
  color: string;
}[] = [
  {
    key: 'notify_on_open',
    label: 'Email aberto',
    description: 'Quando um destinatário abre seu email',
    icon: Eye,
    color: 'text-emerald-500',
  },
  {
    key: 'notify_on_click',
    label: 'Link clicado',
    description: 'Quando um link rastreado é clicado',
    icon: MousePointerClick,
    color: 'text-blue-500',
  },
  {
    key: 'notify_on_document_view',
    label: 'Documento visualizado',
    description: 'Quando alguém abre um documento compartilhado',
    icon: FileText,
    color: 'text-violet-500',
  },
  {
    key: 'notify_on_document_download',
    label: 'Documento baixado',
    description: 'Quando alguém baixa um documento compartilhado',
    icon: Download,
    color: 'text-amber-500',
  },
];

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return iso;
  }
}

function NotificationRow({
  notification,
  onMarkRead,
  marking,
}: {
  notification: PushNotification;
  onMarkRead: (id: string) => void;
  marking: boolean;
}) {
  const unread = !notification.read_at;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-3 transition-colors',
        unread ? 'border-primary/30 bg-primary/5' : 'bg-card'
      )}
    >
      <div className="rounded-lg bg-muted p-2">
        <Bell className={cn('h-4 w-4', unread ? 'text-primary' : 'text-muted-foreground')} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm', unread ? 'font-semibold' : 'font-medium')}>
            {notification.title}
          </p>
          {unread && <Badge className="shrink-0 text-[10px]">Nova</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{notification.body}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(notification.created_at)}
          </span>
          {notification.url && (
            <a
              href={notification.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              Abrir <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {unread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              disabled={marking}
              onClick={() => onMarkRead(notification.id)}
            >
              Marcar como lida
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PushNotificationsTab() {
  const { permission, isSupported, requestPermission, showNotification } =
    useDesktopNotifications();
  const {
    preferences,
    isLoading: preferencesLoading,
    updatePreferences,
    isUpdating,
  } = useUserPreferences();
  const { data: notifications, isLoading, isError } = usePushNotifications();
  const sendPush = useSendPushNotification();
  const markRead = useMarkPushNotificationRead();
  const markAllRead = useMarkAllPushNotificationsRead();

  const [form, setForm] = useState({ title: '', body: '', url: '' });

  const items = notifications ?? [];
  const stats = useMemo(() => computePushNotificationStats(items), [items]);
  const isActive = permission === 'granted';

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success('Notificações do navegador ativadas');
      showNotification({
        title: 'FUXICO — notificações ativadas',
        body: 'Você será avisado quando seus emails forem abertos.',
        icon: '/icon-192.png',
        tag: 'fuxico-welcome',
      });
      return;
    }
    toast.error('Permissão para notificações não concedida');
  };

  const handleTestNotification = () => {
    const shown = showNotification({
      title: '📧 Teste de notificação',
      body: 'Se você está vendo isso, os alertas do navegador estão funcionando.',
      icon: '/icon-192.png',
      tag: 'fuxico-test',
    });
    if (shown) toast.success('Notificação de teste exibida');
    else toast.error('Habilite a permissão do navegador primeiro');
  };

  const handleTogglePreference = (
    key: PreferenceKey | 'sound_enabled' | 'desktop_enabled' | 'auto_reminder_enabled',
    value: boolean
  ) => {
    updatePreferences.mutate({ [key]: value });
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      toast.error('Não foi possível marcar a notificação como lida');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch {
      toast.error('Não foi possível marcar as notificações como lidas');
    }
  };

  const handleSend = async () => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      toast.error('Informe título e mensagem');
      return;
    }

    const rawUrl = form.url.trim();
    const url = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
    if (url) {
      try {
        new URL(url);
      } catch {
        toast.error('URL inválida');
        return;
      }
    }

    try {
      await sendPush.mutateAsync({ title, body, ...(url ? { url } : {}) });
      toast.success('Notificação enviada');
      if (isActive) {
        showNotification({ title, body, icon: '/icon-192.png', tag: `fuxico-${Date.now()}` });
      }
      setForm({ title: '', body: '', url: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar notificação');
    }
  };

  const statCards = [
    { label: 'Recebidas', value: String(stats.total), icon: Bell },
    { label: 'Não lidas', value: String(stats.unread), icon: BellRing },
    { label: 'Hoje', value: String(stats.today), icon: Clock },
    { label: 'Última', value: stats.lastAt ? timeAgo(stats.lastAt) : '—', icon: CheckCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2">
            <BellRing className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Push Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Notificações da sua conta e alertas no dispositivo
            </p>
          </div>
        </div>
        <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1">
          {isActive ? <CheckCircle2 className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="p-4">
                <stat.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                <div className="truncate text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Configuração do dispositivo
            </CardTitle>
            <CardDescription>
              Permissão do navegador e preferências salvas na sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchFirst(
              [
                [
                  !isSupported,
                  () => (
                    <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                      <AlertTriangle className="mb-1 h-4 w-4" />
                      Seu navegador não suporta notificações. Use Chrome, Firefox ou Edge.
                    </div>
                  ),
                ],
                [
                  permission === 'denied',
                  () => (
                    <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                      <BellOff className="mb-1 h-4 w-4" />
                      Notificações bloqueadas. Libere o acesso nas configurações do navegador.
                    </div>
                  ),
                ],
                [
                  permission === 'granted',
                  () => (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Notificações do navegador permitidas
                    </div>
                  ),
                ],
              ],
              () => (
                <Button className="w-full gap-2" onClick={handleRequestPermission}>
                  <Bell className="h-4 w-4" />
                  Ativar notificações
                </Button>
              )
            )}

            {isActive && (
              <Button variant="outline" className="w-full gap-2" onClick={handleTestNotification}>
                <Send className="h-4 w-4" />
                Exibir notificação de teste
              </Button>
            )}

            <Separator />

            <div className="space-y-3">
              {[
                {
                  key: 'sound_enabled' as const,
                  label: 'Som de notificação',
                  value: preferences?.sound_enabled ?? true,
                },
                {
                  key: 'desktop_enabled' as const,
                  label: 'Alertas no desktop',
                  value: preferences?.desktop_enabled ?? true,
                },
                {
                  key: 'auto_reminder_enabled' as const,
                  label: 'Lembrete automático de follow-up',
                  value: preferences?.auto_reminder_enabled ?? false,
                },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between">
                  <Label htmlFor={`push-pref-${row.key}`}>{row.label}</Label>
                  <Switch
                    id={`push-pref-${row.key}`}
                    checked={row.value}
                    disabled={preferencesLoading || isUpdating}
                    onCheckedChange={(value) => handleTogglePreference(row.key, value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Tipos de notificação
            </CardTitle>
            <CardDescription>Eventos que geram notificação para você</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferencesLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              NOTIFICATION_TYPES.map((type) => (
                <div
                  key={type.key}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="rounded-lg bg-muted p-2">
                    <type.icon className={cn('h-4 w-4', type.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  <Switch
                    checked={preferences?.[type.key] ?? true}
                    disabled={isUpdating}
                    onCheckedChange={(value) => handleTogglePreference(type.key, value)}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notificações recebidas
              </CardTitle>
              <CardDescription>Histórico do canal push da sua conta</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={stats.unread === 0 || markAllRead.isPending}
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                <AlertTriangle className="mb-1 h-4 w-4" />
                Não foi possível carregar suas notificações.
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                type="notifications"
                title="Nenhuma notificação ainda"
                description="Quando algo acontecer nos seus emails, a notificação aparece aqui."
                size="sm"
              />
            ) : (
              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-2">
                  {items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      marking={markRead.isPending}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Enviar notificação
            </CardTitle>
            <CardDescription>
              Dispara uma notificação real para a sua conta via send-push-notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="push-title">Título</Label>
              <Input
                id="push-title"
                maxLength={100}
                placeholder="Email aberto por cliente"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="push-body">Mensagem</Label>
              <Textarea
                id="push-body"
                maxLength={500}
                rows={3}
                placeholder="maria@empresa.com abriu a proposta comercial"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="push-url">Link (opcional)</Label>
              <Input
                id="push-url"
                placeholder="https://fuxico-v2.vercel.app/dashboard"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <Button className="w-full gap-2" onClick={handleSend} disabled={sendPush.isPending}>
              <Send className="h-4 w-4" />
              {sendPush.isPending ? 'Enviando…' : 'Enviar notificação'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
