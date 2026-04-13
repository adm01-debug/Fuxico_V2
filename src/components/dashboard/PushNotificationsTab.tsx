// =============================================================================
// FUXICO - PWA Push Notifications Tab
// =============================================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Bell, BellRing, BellOff, Smartphone, CheckCircle2, 
  AlertTriangle, Settings, Volume2, VolumeX, Eye, MousePointerClick,
  Mail, Shield, Zap, Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NotificationPreferences {
  emailOpened: boolean
  linkClicked: boolean
  bounceDetected: boolean
  followUpDue: boolean
  dailyDigest: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  soundEnabled: boolean
  urgentOnly: boolean
}

export default function PushNotificationsTab() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOpened: true,
    linkClicked: true,
    bounceDetected: true,
    followUpDue: true,
    dailyDigest: false,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    soundEnabled: true,
    urgentOnly: false,
  })

  useEffect(() => {
    setIsSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        setIsSubscribed(true)
        toast.success('Notificações push ativadas!')
        // Send test notification
        new Notification('FUXICO - Notificações Ativadas! ✅', {
          body: 'Você receberá alertas quando seus emails forem abertos.',
          icon: '/favicon.ico',
        })
      } else {
        toast.error('Permissão para notificações negada')
      }
    } catch {
      toast.error('Erro ao solicitar permissão')
    }
  }

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('📧 Email Aberto!', {
        body: 'maria@empresa.com abriu "Proposta Comercial Q1"',
        icon: '/favicon.ico',
        tag: 'test-notification',
      })
      toast.success('Notificação de teste enviada!')
    }
  }

  const notificationTypes = [
    {
      key: 'emailOpened' as const,
      label: 'Email Aberto',
      description: 'Quando um destinatário abre seu email',
      icon: Eye,
      color: 'text-emerald-500',
    },
    {
      key: 'linkClicked' as const,
      label: 'Link Clicado',
      description: 'Quando um link rastreado é clicado',
      icon: MousePointerClick,
      color: 'text-blue-500',
    },
    {
      key: 'bounceDetected' as const,
      label: 'Bounce Detectado',
      description: 'Quando um email retorna como bounce',
      icon: AlertTriangle,
      color: 'text-destructive',
    },
    {
      key: 'followUpDue' as const,
      label: 'Follow-up Pendente',
      description: 'Lembrete de follow-up agendado',
      icon: Clock,
      color: 'text-amber-500',
    },
    {
      key: 'dailyDigest' as const,
      label: 'Resumo Diário',
      description: 'Resumo de atividades do dia',
      icon: Mail,
      color: 'text-violet-500',
    },
  ]

  const stats = [
    { label: 'Notificações Hoje', value: 24, icon: Bell },
    { label: 'Emails Abertos', value: 18, icon: Eye },
    { label: 'Cliques', value: 6, icon: MousePointerClick },
    { label: 'Alertas', value: 2, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
            <BellRing className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Push Notifications</h2>
            <p className="text-sm text-muted-foreground">Receba alertas em tempo real no seu dispositivo</p>
          </div>
        </div>
        <Badge variant={isSubscribed ? 'default' : 'secondary'} className="gap-1">
          {isSubscribed ? <CheckCircle2 className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          {isSubscribed ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Permission & Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Configuração do Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 mb-1" />
                Seu navegador não suporta notificações push. Use Chrome, Firefox ou Edge.
              </div>
            ) : permission === 'denied' ? (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                <BellOff className="h-4 w-4 mb-1" />
                Notificações bloqueadas. Altere nas configurações do navegador.
              </div>
            ) : permission === 'granted' ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Notificações push ativadas!
              </div>
            ) : (
              <Button className="w-full gap-2" onClick={requestPermission}>
                <Bell className="h-4 w-4" />
                Ativar Notificações Push
              </Button>
            )}

            {permission === 'granted' && (
              <Button variant="outline" className="w-full gap-2" onClick={sendTestNotification}>
                <Zap className="h-4 w-4" />
                Enviar Notificação de Teste
              </Button>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preferences.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <Label>Som de Notificação</Label>
                </div>
                <Switch
                  checked={preferences.soundEnabled}
                  onCheckedChange={(v) => setPreferences({ ...preferences, soundEnabled: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Apenas Urgentes</Label>
                </div>
                <Switch
                  checked={preferences.urgentOnly}
                  onCheckedChange={(v) => setPreferences({ ...preferences, urgentOnly: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label>Modo Silencioso</Label>
                </div>
                <Switch
                  checked={preferences.quietHoursEnabled}
                  onCheckedChange={(v) => setPreferences({ ...preferences, quietHoursEnabled: v })}
                />
              </div>

              {preferences.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <div className="space-y-1">
                    <Label className="text-xs">Início</Label>
                    <Select value={preferences.quietHoursStart} onValueChange={(v) => setPreferences({ ...preferences, quietHoursStart: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['20:00', '21:00', '22:00', '23:00'].map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fim</Label>
                    <Select value={preferences.quietHoursEnd} onValueChange={(v) => setPreferences({ ...preferences, quietHoursEnd: v })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['06:00', '07:00', '08:00', '09:00'].map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tipos de Notificação
            </CardTitle>
            <CardDescription>Escolha quais eventos geram notificações push</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className={cn("p-2 rounded-lg bg-muted")}>
                  <type.icon className={cn("h-4 w-4", type.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                <Switch
                  checked={preferences[type.key]}
                  onCheckedChange={(v) => setPreferences({ ...preferences, [type.key]: v })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
