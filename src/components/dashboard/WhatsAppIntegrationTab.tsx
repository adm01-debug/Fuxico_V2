// =============================================================================
// FUXICO - WhatsApp Business Integration Tab
// =============================================================================

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  MessageCircle, Settings, Zap, Clock, CheckCircle2, 
  AlertTriangle, Send, Users, ArrowRight, Shield 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WhatsAppConfig {
  enabled: boolean
  phoneNumber: string
  apiKey: string
  autoFollowUp: boolean
  followUpDelay: number
  followUpMessage: string
  maxRetries: number
  businessHoursOnly: boolean
}

interface WhatsAppStats {
  messagesSent: number
  delivered: number
  read: number
  replied: number
}

export default function WhatsAppIntegrationTab() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    enabled: false,
    phoneNumber: '',
    apiKey: '',
    autoFollowUp: true,
    followUpDelay: 24,
    followUpMessage: 'Olá! Vi que você ainda não abriu o email que enviei sobre {{assunto}}. Posso ajudar?',
    maxRetries: 2,
    businessHoursOnly: true,
  })

  const [stats] = useState<WhatsAppStats>({
    messagesSent: 156,
    delivered: 148,
    read: 124,
    replied: 67,
  })

  const handleSave = () => {
    toast.success('Configurações do WhatsApp salvas!')
  }

  const statsItems = [
    { label: 'Mensagens Enviadas', value: stats.messagesSent, icon: Send, color: 'text-blue-500' },
    { label: 'Entregues', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Lidas', value: stats.read, icon: MessageCircle, color: 'text-violet-500' },
    { label: 'Respondidas', value: stats.replied, icon: Users, color: 'text-amber-500' },
  ]

  const automationRules = [
    { 
      name: 'Follow-up Automático',
      description: 'Enviar WhatsApp quando email não for aberto em 24h',
      enabled: config.autoFollowUp,
      icon: Zap,
    },
    { 
      name: 'Horário Comercial',
      description: 'Enviar apenas entre 08:00 e 18:00',
      enabled: config.businessHoursOnly,
      icon: Clock,
    },
    { 
      name: 'Limite de Retentativas',
      description: `Máximo de ${config.maxRetries} mensagens por contato`,
      enabled: true,
      icon: Shield,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <MessageCircle className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Integração WhatsApp Business</h2>
            <p className="text-sm text-muted-foreground">Follow-up automático via WhatsApp quando emails não são abertos</p>
          </div>
        </div>
        <Badge variant={config.enabled ? 'default' : 'secondary'} className="gap-1">
          {config.enabled ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {config.enabled ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <item.icon className={cn("h-5 w-5 mb-2", item.color)} />
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração da API
            </CardTitle>
            <CardDescription>Configure sua conexão com WhatsApp Business API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ativar Integração</Label>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Telefone</Label>
              <Input
                placeholder="+55 11 99999-9999"
                value={config.phoneNumber}
                onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Sua chave da API WhatsApp Business"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha sua API Key em business.whatsapp.com
              </p>
            </div>

            <div className="space-y-2">
              <Label>Delay do Follow-up (horas)</Label>
              <Select 
                value={String(config.followUpDelay)} 
                onValueChange={(v) => setConfig({ ...config, followUpDelay: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                  <SelectItem value="72">72 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mensagem de Follow-up</Label>
              <Textarea
                value={config.followUpMessage}
                onChange={(e) => setConfig({ ...config, followUpMessage: e.target.value })}
                rows={3}
                placeholder="Use {{assunto}} para o assunto do email"
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {'{{nome}}'}, {'{{assunto}}'}, {'{{empresa}}'}
              </p>
            </div>

            <Button className="w-full gap-2" onClick={handleSave}>
              <CheckCircle2 className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {/* Automation Rules */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Regras de Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="p-2 rounded-lg bg-muted">
                    <rule.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <Badge variant={rule.enabled ? 'default' : 'outline'} className="text-xs">
                    {rule.enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fluxo de Automação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: '1', label: 'Email enviado', desc: 'Rastreamento ativado' },
                  { step: '2', label: `Espera ${config.followUpDelay}h`, desc: 'Verifica se foi aberto' },
                  { step: '3', label: 'Não abriu?', desc: 'Envia WhatsApp automático' },
                  { step: '4', label: 'Follow-up enviado', desc: 'Monitora resposta' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
