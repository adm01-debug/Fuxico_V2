// =============================================================================
// FUXICO - Dashboard de Analytics Avançado
// Arquivo: src/components/dashboard/AdvancedAnalytics.tsx
// Descrição: Métricas de engajamento, comparativos temporais e insights
// =============================================================================

import React, { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointer,
  Eye,
  AlertTriangle,
  Clock,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useTrackingStats, useTrackedEmails } from '@/hooks/use-tracking'
import { useTrackingTrends } from '@/hooks/use-tracking-trends'
import { cn } from '@/lib/utils'

// =============================================================================
// TIPOS
// =============================================================================

type TimeRange = '7d' | '30d' | '90d' | '12m'
type MetricType = 'opens' | 'clicks' | 'bounces' | 'engagement'

interface TrendData {
  date: string
  opens: number
  clicks: number
  sent: number
  bounced: number
}

interface InsightCard {
  title: string
  description: string
  type: 'success' | 'warning' | 'info' | 'error'
  action?: string
}

// =============================================================================
// CONSTANTES
// =============================================================================

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '12m', label: 'Último ano' },
]

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#94a3b8',
}

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, change, changeLabel, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            ) : null}
            <span
              className={cn(
                'text-xs',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change > 0 ? '+' : ''}{change}% {changeLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface InsightBadgeProps {
  insight: InsightCard
}

function InsightBadge({ insight }: InsightBadgeProps) {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }
  
  const icons = {
    success: <TrendingUp className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Eye className="h-4 w-4" />,
    error: <TrendingDown className="h-4 w-4" />,
  }
  
  return (
    <Card className={cn('border', typeStyles[insight.type])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[insight.type]}</div>
          <div>
            <p className="font-medium">{insight.title}</p>
            <p className="text-sm opacity-80">{insight.description}</p>
            {insight.action && (
              <button className="text-sm font-medium mt-2 underline">
                {insight.action}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [activeMetric, setActiveMetric] = useState<MetricType>('opens')
  
  // Hooks de dados
  const { data: stats, isLoading: statsLoading } = useTrackingStats()
  const { data: trends, isLoading: trendsLoading } = useTrackingTrends(timeRange)
  const { data: emails } = useTrackedEmails({}, 0, 100)
  
  // Cálculos derivados
  const metrics = useMemo(() => {
    if (!stats || !emails?.data) return null
    
    const totalEmails = stats.totalEmails
    const totalOpens = stats.totalOpens
    const totalClicks = stats.totalClicks
    const bounced = stats.bounced
    
    const openRate = totalEmails > 0 ? ((stats.uniqueOpens / totalEmails) * 100).toFixed(1) : 0
    const clickRate = stats.uniqueOpens > 0 ? ((totalClicks / stats.uniqueOpens) * 100).toFixed(1) : 0
    const bounceRate = totalEmails > 0 ? ((bounced / totalEmails) * 100).toFixed(1) : 0
    
    // Calcular média de tempo para primeira abertura
    const emailsWithOpen = emails.data.filter(e => e.first_opened_at)
    const avgTimeToOpen = emailsWithOpen.length > 0
      ? emailsWithOpen.reduce((acc, email) => {
          const sent = new Date(email.created_at)
          const opened = new Date(email.first_opened_at!)
          return acc + (opened.getTime() - sent.getTime()) / (1000 * 60 * 60) // horas
        }, 0) / emailsWithOpen.length
      : 0
    
    return {
      totalEmails,
      totalOpens,
      totalClicks,
      bounced,
      openRate,
      clickRate,
      bounceRate,
      avgTimeToOpen: avgTimeToOpen.toFixed(1),
    }
  }, [stats, emails])
  
  // Insights gerados
  const insights = useMemo<InsightCard[]>(() => {
    if (!metrics) return []
    
    const result: InsightCard[] = []
    
    // Taxa de abertura
    if (Number(metrics.openRate) > 25) {
      result.push({
        title: 'Excelente taxa de abertura!',
        description: `Sua taxa de ${metrics.openRate}% está acima da média do mercado (20-25%).`,
        type: 'success',
      })
    } else if (Number(metrics.openRate) < 15) {
      result.push({
        title: 'Taxa de abertura baixa',
        description: 'Considere melhorar seus assuntos de email ou segmentar melhor sua lista.',
        type: 'warning',
        action: 'Ver dicas de melhoria',
      })
    }
    
    // Taxa de bounce
    if (Number(metrics.bounceRate) > 5) {
      result.push({
        title: 'Alta taxa de bounce',
        description: `${metrics.bounceRate}% dos seus emails estão retornando. Limpe sua lista de contatos.`,
        type: 'error',
        action: 'Limpar lista',
      })
    }
    
    // Tempo de abertura
    if (Number(metrics.avgTimeToOpen) < 2) {
      result.push({
        title: 'Respostas rápidas',
        description: 'Seus destinatários abrem emails em menos de 2 horas em média!',
        type: 'info',
      })
    }
    
    return result
  }, [metrics])
  
  // Dados para gráficos
  const trendData = useMemo<TrendData[]>(() => {
    if (!trends?.data) return []
    return trends.data
  }, [trends])
  
  // Distribuição por status
  const statusDistribution = useMemo(() => {
    if (!emails?.data) return []
    
    const statusCounts = emails.data.reduce((acc, email) => {
      const status = email.opens > 0 ? 'Lidos' : 
                     email.delivery_status === 'bounced' ? 'Bounced' : 'Não lidos'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }))
  }, [emails])
  
  // Loading state
  if (statsLoading || trendsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header com seletor de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avançado</h2>
          <p className="text-muted-foreground">
            Métricas detalhadas de engajamento
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Cards de métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Emails Enviados"
          value={metrics?.totalEmails || 0}
          icon={<Mail className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Taxa de Abertura"
          value={`${metrics?.openRate || 0}%`}
          change={5.2}
          changeLabel="vs. período anterior"
          trend="up"
          icon={<Eye className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Taxa de Cliques"
          value={`${metrics?.clickRate || 0}%`}
          change={-2.1}
          changeLabel="vs. período anterior"
          trend="down"
          icon={<MousePointer className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Tempo Médio para Abertura"
          value={`${metrics?.avgTimeToOpen || 0}h`}
          icon={<Clock className="h-4 w-4 text-primary" />}
        />
      </div>
      
      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <InsightBadge key={i} insight={insight} />
          ))}
        </div>
      )}
      
      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tendência ao longo do tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Engajamento</CardTitle>
            <CardDescription>
              Evolução das métricas no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricType)}>
              <TabsList className="mb-4">
                <TabsTrigger value="opens">Aberturas</TabsTrigger>
                <TabsTrigger value="clicks">Cliques</TabsTrigger>
              </TabsList>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey={activeMetric}
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Distribuição por status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Proporção de emails por status de leitura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Métricas adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Saúde</CardTitle>
          <CardDescription>
            Indicadores de qualidade da sua lista e entregas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taxa de Entrega</span>
              <span className="text-sm text-muted-foreground">
                {100 - Number(metrics?.bounceRate || 0)}%
              </span>
            </div>
            <Progress value={100 - Number(metrics?.bounceRate || 0)} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Engajamento Geral</span>
              <span className="text-sm text-muted-foreground">
                {Number(metrics?.openRate || 0) + Number(metrics?.clickRate || 0)}%
              </span>
            </div>
            <Progress 
              value={Number(metrics?.openRate || 0) + Number(metrics?.clickRate || 0)} 
              className="h-2" 
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Qualidade da Lista</span>
              <span className="text-sm text-muted-foreground">
                {Math.max(0, 100 - Number(metrics?.bounceRate || 0) * 5)}%
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - Number(metrics?.bounceRate || 0) * 5)} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
