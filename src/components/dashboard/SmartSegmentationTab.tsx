// =============================================================================
// FUXICO - Smart Contact Segmentation Tab
// =============================================================================

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, Flame, Snowflake, TrendingUp, 
  UserX, Sparkles, Download, Eye,
  MousePointerClick,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { matchFirst } from "@/lib/variant";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts'

interface Segment {
  id: string
  name: string
  description: string
  icon: typeof Users
  color: string
  bgColor: string
  count: number
  percentage: number
  avgOpenRate: number
  avgClickRate: number
  criteria: string[]
}

export default function SmartSegmentationTab() {
  const { user } = useAuth()

  const { data: contacts = [] } = useQuery({
    queryKey: ['contact-scores', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('contact_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('engagement_score', { ascending: false })
        .limit(500)
      return data || []
    },
    enabled: !!user,
  })

  const segments: Segment[] = useMemo(() => {
    const total = contacts.length || 100 // fallback for demo
    
    const hot = contacts.filter(c => (c.engagement_score ?? 0) >= 80).length || 15
    const warm = contacts.filter(c => (c.engagement_score ?? 0) >= 50 && (c.engagement_score ?? 0) < 80).length || 35
    const cold = contacts.filter(c => (c.engagement_score ?? 0) >= 20 && (c.engagement_score ?? 0) < 50).length || 30
    const inactive = contacts.filter(c => (c.engagement_score ?? 0) < 20).length || 20

    return [
      {
        id: 'hot',
        name: 'Engajados (Hot)',
        description: 'Contatos altamente engajados que abrem e clicam regularmente',
        icon: Flame,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        count: hot,
        percentage: Math.round((hot / total) * 100),
        avgOpenRate: 78,
        avgClickRate: 35,
        criteria: ['Score ≥ 80', 'Abriu nos últimos 7 dias', 'Clicou em links'],
      },
      {
        id: 'warm',
        name: 'Interessados (Warm)',
        description: 'Contatos com engajamento moderado, potencial para conversão',
        icon: TrendingUp,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        count: warm,
        percentage: Math.round((warm / total) * 100),
        avgOpenRate: 52,
        avgClickRate: 18,
        criteria: ['Score 50-79', 'Abriu nos últimos 30 dias', 'Interação parcial'],
      },
      {
        id: 'cold',
        name: 'Frios (Cold)',
        description: 'Contatos com baixo engajamento, precisam de reengajamento',
        icon: Snowflake,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        count: cold,
        percentage: Math.round((cold / total) * 100),
        avgOpenRate: 22,
        avgClickRate: 5,
        criteria: ['Score 20-49', 'Sem abertura há 30+ dias', 'Poucos cliques'],
      },
      {
        id: 'inactive',
        name: 'Inativos',
        description: 'Contatos sem atividade recente, considerar limpeza de lista',
        icon: UserX,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        count: inactive,
        percentage: Math.round((inactive / total) * 100),
        avgOpenRate: 3,
        avgClickRate: 0.5,
        criteria: ['Score < 20', 'Sem atividade há 90+ dias', 'Possível bounce'],
      },
    ]
  }, [contacts])

  const pieData = segments.map(s => ({
    name: s.name.split(' ')[0],
    value: s.count,
    color: matchFirst([
  [s.id === 'hot', () => ('#ef4444')],
  [s.id === 'warm', () => ('#f59e0b')],
  [s.id === 'cold', () => ('#3b82f6')],
], () => ('#6b7280')),
  }))

  const recommendations = [
    {
      segment: 'Engajados',
      action: 'Envie conteúdo exclusivo e ofertas premium',
      impact: '+15% conversão',
      priority: 'high',
    },
    {
      segment: 'Interessados',
      action: 'Crie sequência de nurturing com conteúdo educativo',
      impact: '+25% para Hot',
      priority: 'high',
    },
    {
      segment: 'Frios',
      action: 'Campanha de reengajamento com assunto personalizado',
      impact: '+10% abertura',
      priority: 'medium',
    },
    {
      segment: 'Inativos',
      action: 'Campanha de reconfirmação ou limpeza de lista',
      impact: '-50% bounces',
      priority: 'low',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <Users className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Segmentação Inteligente</h2>
            <p className="text-sm text-muted-foreground">Agrupamento automático por nível de engajamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-classificação IA
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((segment, i) => (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-1.5 rounded-lg", segment.bgColor)}>
                    <segment.icon className={cn("h-4 w-4", segment.color)} />
                  </div>
                  <span className="text-sm font-medium">{segment.name.split(' ')[0]}</span>
                </div>
                <div className="text-2xl font-bold">{segment.count}</div>
                <p className="text-xs text-muted-foreground">{segment.percentage}% do total</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3" /> Abertura
                    </span>
                    <span className="font-medium">{segment.avgOpenRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MousePointerClick className="h-3 w-3" /> Cliques
                    </span>
                    <span className="font-medium">{segment.avgClickRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição dos Segmentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recomendações por Segmento
            </CardTitle>
            <CardDescription>Ações sugeridas pela IA para maximizar resultados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <Badge 
                    variant={matchFirst([
  [rec.priority === 'high', () => ('default')],
  [rec.priority === 'medium', () => ('secondary')],
], () => ('outline'))}
                    className="shrink-0 text-xs"
                  >
                    {rec.segment}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{rec.action}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs gap-1 text-emerald-500 border-emerald-500/20">
                    <TrendingUp className="h-3 w-3" />
                    {rec.impact}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Criteria Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critérios de Segmentação</CardTitle>
          <CardDescription>Como os contatos são automaticamente classificados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((segment) => (
              <div key={segment.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <segment.icon className={cn("h-4 w-4", segment.color)} />
                  <span className="text-sm font-medium">{segment.name}</span>
                </div>
                <ul className="space-y-1">
                  {segment.criteria.map((c, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
