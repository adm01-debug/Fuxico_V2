// =============================================================================
// FUXICO - Real-time Analytics Dashboard
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Activity, Eye, MousePointerClick, Mail, Zap, Clock, 
  ArrowUpRight, ArrowDownRight, Pause, Play, Wifi, WifiOff 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts'

interface RealtimeEvent {
  id: string
  type: 'open' | 'click' | 'bounce' | 'delivered'
  email: string
  subject?: string
  timestamp: Date
  country?: string
  device?: string
}

interface LiveMetric {
  label: string
  value: number
  change: number
  icon: typeof Activity
  color: string
}

export default function RealtimeAnalyticsTab() {
  const { user } = useAuth()
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [isLive, setIsLive] = useState(true)
  const [connected, setConnected] = useState(false)
  const [liveOpens, setLiveOpens] = useState(0)
  const [liveClicks, setLiveClicks] = useState(0)
  const [liveBounces, setLiveBounces] = useState(0)
  const [chartData, setChartData] = useState<{ time: string; opens: number; clicks: number }[]>([])

  // Generate initial chart data
  useEffect(() => {
    const now = new Date()
    const data = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      return {
        time: hour.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        opens: Math.floor(Math.random() * 30) + 5,
        clicks: Math.floor(Math.random() * 15) + 2,
      }
    })
    setChartData(data)
  }, [])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isLive || !user) return

    const channel = supabase
      .channel('realtime-analytics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracked_emails' },
        (payload) => {
          const newEvent: RealtimeEvent = {
            id: crypto.randomUUID(),
            type: 'open',
            email: (payload.new as Record<string, unknown>).recipient_email as string || 'unknown',
            subject: (payload.new as Record<string, unknown>).subject as string,
            timestamp: new Date(),
          }
          setEvents(prev => [newEvent, ...prev].slice(0, 50))
          setLiveOpens(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'link_click_events' },
        (payload) => {
          const newEvent: RealtimeEvent = {
            id: crypto.randomUUID(),
            type: 'click',
            email: 'Link clicado',
            timestamp: new Date(),
            country: (payload.new as Record<string, unknown>).country as string,
          }
          setEvents(prev => [newEvent, ...prev].slice(0, 50))
          setLiveClicks(prev => prev + 1)
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      setConnected(false)
    }
  }, [isLive, user])

  // Simulate realtime data for demo
  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      const types: RealtimeEvent['type'][] = ['open', 'click', 'delivered', 'open', 'open']
      const type = types[Math.floor(Math.random() * types.length)]
      const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'empresa.com.br']
      const names = ['Maria', 'João', 'Ana', 'Pedro', 'Lucas', 'Carla', 'Bruno', 'Julia']
      
      const event: RealtimeEvent = {
        id: crypto.randomUUID(),
        type,
        email: `${names[Math.floor(Math.random() * names.length)].toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`,
        subject: type === 'open' ? 'Proposta comercial #' + Math.floor(Math.random() * 1000) : undefined,
        timestamp: new Date(),
        country: ['BR', 'US', 'PT', 'AR'][Math.floor(Math.random() * 4)],
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
      }
      
      setEvents(prev => [event, ...prev].slice(0, 50))
      
      if (type === 'open') setLiveOpens(prev => prev + 1)
      if (type === 'click') setLiveClicks(prev => prev + 1)
      if (type === 'bounce') setLiveBounces(prev => prev + 1)

      // Update chart
      setChartData(prev => {
        const updated = [...prev]
        if (updated.length > 0) {
          const last = { ...updated[updated.length - 1] }
          last.opens += type === 'open' ? 1 : 0
          last.clicks += type === 'click' ? 1 : 0
          updated[updated.length - 1] = last
        }
        return updated
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive])

  const metrics: LiveMetric[] = [
    { label: 'Aberturas ao Vivo', value: liveOpens, change: 12, icon: Eye, color: 'text-emerald-500' },
    { label: 'Cliques ao Vivo', value: liveClicks, change: 8, icon: MousePointerClick, color: 'text-blue-500' },
    { label: 'Bounces', value: liveBounces, change: -3, icon: Mail, color: 'text-destructive' },
    { label: 'Taxa de Engajamento', value: liveOpens > 0 ? Math.round((liveClicks / liveOpens) * 100) : 0, change: 5, icon: Zap, color: 'text-amber-500' },
  ]

  const eventTypeConfig = {
    open: { icon: Eye, color: 'bg-emerald-500/10 text-emerald-500', label: 'Abertura' },
    click: { icon: MousePointerClick, color: 'bg-blue-500/10 text-blue-500', label: 'Clique' },
    bounce: { icon: Mail, color: 'bg-destructive/10 text-destructive', label: 'Bounce' },
    delivered: { icon: Mail, color: 'bg-primary/10 text-primary', label: 'Entregue' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-6 w-6 text-primary" />
            {isLive && (
              <motion.span
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Analytics em Tempo Real</h2>
            <p className="text-sm text-muted-foreground">Monitoramento ao vivo de aberturas e cliques</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'} className="gap-1">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Conectado' : 'Desconectado'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="gap-1.5"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Pausar' : 'Ao Vivo'}
          </Button>
        </div>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={cn("h-5 w-5", metric.color)} />
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    metric.change > 0 ? "text-emerald-500" : "text-destructive"
                  )}>
                    {metric.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="text-2xl font-bold">{metric.label === 'Taxa de Engajamento' ? `${metric.value}%` : metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </CardContent>
              {isLive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30"
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Atividade nas Últimas 24h
            {isLive && (
              <Badge variant="outline" className="text-xs gap-1">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                LIVE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="openGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
              <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Area type="monotone" dataKey="opens" stroke="hsl(var(--primary))" fill="url(#openGradient)" strokeWidth={2} name="Aberturas" />
              <Area type="monotone" dataKey="clicks" stroke="hsl(210, 100%, 50%)" fill="url(#clickGradient)" strokeWidth={2} name="Cliques" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Event Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feed de Eventos ao Vivo</CardTitle>
          <CardDescription>{events.length} eventos capturados nesta sessão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aguardando eventos...</p>
                  <p className="text-xs mt-1">Novos eventos aparecerão aqui automaticamente</p>
                </div>
              ) : (
                events.map((event) => {
                  const config = eventTypeConfig[event.type]
                  const EventIcon = config.icon
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className={cn("p-2 rounded-lg", config.color)}>
                        <EventIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] shrink-0">{config.label}</Badge>
                          <span className="text-sm font-medium truncate">{event.email}</span>
                        </div>
                        {event.subject && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{event.subject}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {event.country && (
                          <Badge variant="secondary" className="text-[10px]">{event.country}</Badge>
                        )}
                        {event.device && (
                          <Badge variant="secondary" className="text-[10px]">{event.device}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
