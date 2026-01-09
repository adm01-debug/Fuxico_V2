import React, { useState, useMemo } , memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from 'lucide-react';

interface CampaignStats {
  id: string;
  name: string;
  status: string;
  totalEmails: number;
  opens: number;
  clicks: number;
  bounces: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

function CampaignComparisonTabBase() {
  const { user } = useAuth();
  const [campaign1Id, setCampaign1Id] = useState<string>('');
  const [campaign2Id, setCampaign2Id] = useState<string>('');

  // Fetch campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns-list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch campaign stats
  const { data: campaignStats, isLoading: loadingStats } = useQuery({
    queryKey: ['campaign-stats', user?.id, campaign1Id, campaign2Id],
    queryFn: async () => {
      const campaignIds = [campaign1Id, campaign2Id].filter(Boolean);
      if (campaignIds.length === 0) return [];

      const stats: CampaignStats[] = [];

      for (const campaignId of campaignIds) {
        const campaign = campaigns?.find(c => c.id === campaignId);
        if (!campaign) continue;

        // Get tracked emails for this campaign
        const { data: emails } = await supabase
          .from('tracked_emails')
          .select('tracking_id, delivery_status, bounce_type')
          .eq('campaign_id', campaignId);

        const trackingIds = emails?.map(e => e.tracking_id) || [];
        
        // Get events for these emails
        const { data: events } = await supabase
          .from('tracking_events')
          .select('event_type, tracking_id')
          .in('tracking_id', trackingIds.length > 0 ? trackingIds : ['none']);

        const totalEmails = emails?.length || 0;
        const opens = events?.filter(e => e.event_type === 'open').length || 0;
        const clicks = events?.filter(e => e.event_type === 'click').length || 0;
        const bounces = emails?.filter(e => e.bounce_type).length || 0;

        stats.push({
          id: campaignId,
          name: campaign.name,
          status: campaign.status,
          totalEmails,
          opens,
          clicks,
          bounces,
          openRate: totalEmails > 0 ? (opens / totalEmails) * 100 : 0,
          clickRate: totalEmails > 0 ? (clicks / totalEmails) * 100 : 0,
          bounceRate: totalEmails > 0 ? (bounces / totalEmails) * 100 : 0,
        });
      }

      return stats;
    },
    enabled: !!user && (!!campaign1Id || !!campaign2Id),
  });

  const comparisonData = useMemo(() => {
    if (!campaignStats || campaignStats.length < 2) return null;

    const [c1, c2] = campaignStats;
    
    return {
      barData: [
        { metric: 'Emails', [c1.name]: c1.totalEmails, [c2.name]: c2.totalEmails },
        { metric: 'Aberturas', [c1.name]: c1.opens, [c2.name]: c2.opens },
        { metric: 'Cliques', [c1.name]: c1.clicks, [c2.name]: c2.clicks },
        { metric: 'Bounces', [c1.name]: c1.bounces, [c2.name]: c2.bounces },
      ],
      radarData: [
        { metric: 'Taxa Abertura', [c1.name]: c1.openRate, [c2.name]: c2.openRate, fullMark: 100 },
        { metric: 'Taxa Clique', [c1.name]: c1.clickRate, [c2.name]: c2.clickRate, fullMark: 100 },
        { metric: 'Engajamento', [c1.name]: Math.min((c1.openRate + c1.clickRate) / 2, 100), [c2.name]: Math.min((c2.openRate + c2.clickRate) / 2, 100), fullMark: 100 },
        { metric: 'Entregabilidade', [c1.name]: 100 - c1.bounceRate, [c2.name]: 100 - c2.bounceRate, fullMark: 100 },
      ],
      comparison: [
        { 
          metric: 'Taxa de Abertura', 
          c1Value: c1.openRate.toFixed(1) + '%', 
          c2Value: c2.openRate.toFixed(1) + '%',
          diff: c1.openRate - c2.openRate,
          winner: c1.openRate > c2.openRate ? 1 : c1.openRate < c2.openRate ? 2 : 0
        },
        { 
          metric: 'Taxa de Clique', 
          c1Value: c1.clickRate.toFixed(1) + '%', 
          c2Value: c2.clickRate.toFixed(1) + '%',
          diff: c1.clickRate - c2.clickRate,
          winner: c1.clickRate > c2.clickRate ? 1 : c1.clickRate < c2.clickRate ? 2 : 0
        },
        { 
          metric: 'Taxa de Bounce', 
          c1Value: c1.bounceRate.toFixed(1) + '%', 
          c2Value: c2.bounceRate.toFixed(1) + '%',
          diff: c2.bounceRate - c1.bounceRate, // Lower is better
          winner: c1.bounceRate < c2.bounceRate ? 1 : c1.bounceRate > c2.bounceRate ? 2 : 0
        },
        { 
          metric: 'Total de Emails', 
          c1Value: c1.totalEmails.toString(), 
          c2Value: c2.totalEmails.toString(),
          diff: c1.totalEmails - c2.totalEmails,
          winner: c1.totalEmails > c2.totalEmails ? 1 : c1.totalEmails < c2.totalEmails ? 2 : 0
        },
      ],
      campaigns: [c1, c2],
    };
  }, [campaignStats]);

  const getTrendIcon = (winner: number, position: number) => {
    if (winner === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (winner === position) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (loadingCampaigns) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparação de Campanhas
          </CardTitle>
          <CardDescription>
            Selecione duas campanhas para comparar suas métricas lado a lado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campanha 1</label>
              <Select value={campaign1Id} onValueChange={setCampaign1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.filter(c => c.id !== campaign2Id).map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Campanha 2</label>
              <Select value={campaign2Id} onValueChange={setCampaign2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.filter(c => c.id !== campaign1Id).map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loadingStats && (campaign1Id || campaign2Id) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      )}

      {comparisonData && (
        <>
          {/* Metrics Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Comparativo de Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Métrica</th>
                      <th className="text-center py-3 px-4 font-medium">
                        <Badge variant="outline" className="bg-primary/10">
                          {comparisonData.campaigns[0].name}
                        </Badge>
                      </th>
                      <th className="text-center py-3 px-4 font-medium">
                        <Badge variant="outline" className="bg-secondary/50">
                          {comparisonData.campaigns[1].name}
                        </Badge>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.comparison.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium">{row.metric}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getTrendIcon(row.winner, 1)}
                            <span className={row.winner === 1 ? 'text-green-600 font-semibold' : ''}>
                              {row.c1Value}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getTrendIcon(row.winner, 2)}
                            <span className={row.winner === 2 ? 'text-green-600 font-semibold' : ''}>
                              {row.c2Value}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Volumes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData.barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metric" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey={comparisonData.campaigns[0].name} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={comparisonData.campaigns[1].name} fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparação de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={comparisonData.radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                    <Radar 
                      name={comparisonData.campaigns[0].name} 
                      dataKey={comparisonData.campaigns[0].name} 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name={comparisonData.campaigns[1].name} 
                      dataKey={comparisonData.campaigns[1].name} 
                      stroke="hsl(var(--secondary))" 
                      fill="hsl(var(--secondary))" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!campaign1Id && !campaign2Id && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione campanhas para comparar</h3>
            <p className="text-muted-foreground">
              Escolha duas campanhas acima para visualizar uma comparação detalhada das métricas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


export const CampaignComparisonTab = memo(CampaignComparisonTabBase);
