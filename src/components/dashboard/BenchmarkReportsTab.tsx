// =============================================================================
// FUXICO - Benchmark / Comparative Reports Tab
// =============================================================================

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Target, Award, Info, RefreshCw, Download 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

interface BenchmarkMetric {
  name: string
  yourValue: number
  industryAvg: number
  topPerformers: number
  unit: string
  status: 'above' | 'below' | 'average'
}

export default function BenchmarkReportsTab() {
  const [industry, setIndustry] = useState('saas')
  const [period, setPeriod] = useState('30d')

  const metrics: BenchmarkMetric[] = [
    { name: 'Taxa de Abertura', yourValue: 42, industryAvg: 28, topPerformers: 55, unit: '%', status: 'above' },
    { name: 'Taxa de Cliques', yourValue: 8.5, industryAvg: 4.2, topPerformers: 12, unit: '%', status: 'above' },
    { name: 'Taxa de Bounce', yourValue: 2.1, industryAvg: 3.8, topPerformers: 0.8, unit: '%', status: 'above' },
    { name: 'Taxa de Rejeição', yourValue: 0.3, industryAvg: 0.5, topPerformers: 0.1, unit: '%', status: 'above' },
    { name: 'Tempo até Abertura', yourValue: 4.2, industryAvg: 6.5, topPerformers: 2.1, unit: 'h', status: 'above' },
    { name: 'Engajamento Médio', yourValue: 72, industryAvg: 45, topPerformers: 88, unit: 'pts', status: 'above' },
  ]

  const radarData = metrics.map(m => ({
    metric: m.name.replace('Taxa de ', ''),
    you: Math.round((m.yourValue / m.topPerformers) * 100),
    industry: Math.round((m.industryAvg / m.topPerformers) * 100),
  }))

  const barData = metrics.map(m => ({
    name: m.name.split(' ').slice(-1)[0],
    'Você': m.yourValue,
    'Média do Setor': m.industryAvg,
    'Top Performers': m.topPerformers,
  }))

  const overallScore = Math.round(
    metrics.reduce((acc, m) => {
      const normalized = m.name.includes('Bounce') || m.name.includes('Rejeição')
        ? (m.industryAvg / Math.max(m.yourValue, 0.1)) * 100
        : (m.yourValue / m.topPerformers) * 100
      return acc + Math.min(normalized, 100)
    }, 0) / metrics.length
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Relatórios Comparativos</h2>
            <p className="text-sm text-muted-foreground">Compare sua performance com o mercado</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="finance">Financeiro</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="health">Saúde</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Score Geral de Performance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{overallScore}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <p className="text-sm mt-1">
                {overallScore >= 80 ? '🏆 Excelente! Acima dos top performers' :
                 overallScore >= 60 ? '✅ Bom! Acima da média do setor' :
                 '⚠️ Há espaço para melhorias'}
              </p>
            </div>
            <div className="hidden sm:block">
              <Badge variant="outline" className="text-lg px-4 py-2 gap-2">
                {overallScore >= 80 ? <Award className="h-5 w-5 text-amber-500" /> :
                 overallScore >= 60 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> :
                 <Target className="h-5 w-5 text-orange-500" />}
                {overallScore >= 80 ? 'Top Performer' :
                 overallScore >= 60 ? 'Acima da Média' : 'Em Desenvolvimento'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, i) => {
          const isInverse = metric.name.includes('Bounce') || metric.name.includes('Rejeição') || metric.name.includes('Tempo')
          const isGood = isInverse ? metric.yourValue < metric.industryAvg : metric.yourValue > metric.industryAvg
          const diff = isInverse
            ? Math.round(((metric.industryAvg - metric.yourValue) / metric.industryAvg) * 100)
            : Math.round(((metric.yourValue - metric.industryAvg) / metric.industryAvg) * 100)

          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <Badge 
                      variant={isGood ? 'default' : 'destructive'} 
                      className={cn("text-xs gap-1", isGood && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}
                    >
                      {isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {diff > 0 ? '+' : ''}{diff}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Você</span>
                      <span className="text-sm font-bold">{metric.yourValue}{metric.unit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((metric.yourValue / metric.topPerformers) * 100, 100)}%` }}
                        transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Média: {metric.industryAvg}{metric.unit}</span>
                      <span>Top: {metric.topPerformers}{metric.unit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar de Performance</CardTitle>
            <CardDescription>Comparação visual com a média do setor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="metric" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs fill-muted-foreground" tick={{ fontSize: 10 }} />
                <Radar name="Você" dataKey="you" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Média do Setor" dataKey="industry" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparativo por Métrica</CardTitle>
            <CardDescription>Suas métricas vs. mercado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="Você" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Média do Setor" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Top Performers" fill="hsl(45, 100%, 50%)" opacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
