// =============================================================================
// FUXICO - Premium TrendChart with Animations
// =============================================================================

import { useState } from "react";
import { useTrackingTrends } from "@/hooks/use-tracking-trends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Eye, MousePointerClick, Calendar, Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom animated tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-4 min-w-[180px]"
    >
      <p className="font-semibold text-sm mb-3 text-foreground">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.name === 'opens' ? 'Aberturas' : 'Cliques'}
              </span>
            </div>
            <span className="font-bold text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Trend indicator component
function TrendIndicator({ current, previous, label }: { current: number; previous: number; label: string }) {
  const diff = current - previous;
  const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : 0;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;
  
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 font-medium",
          isNeutral && "text-muted-foreground",
          isPositive && "text-success border-success/30 bg-success/10",
          !isPositive && !isNeutral && "text-destructive border-destructive/30 bg-destructive/10"
        )}
      >
        <Icon className="h-3 w-3" />
        {isPositive ? "+" : ""}{percentChange}%
      </Badge>
    </div>
  );
}

// Stats summary component
function StatsSummary({ data, period }: { data: any[]; period: number }) {
  const totalOpens = data.reduce((sum, d) => sum + d.opens, 0);
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const avgOpens = Math.round(totalOpens / data.length);
  const avgClicks = Math.round(totalClicks / data.length);
  const ctr = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0";
  
  const halfPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, halfPoint);
  const secondHalf = data.slice(halfPoint);
  
  const firstHalfOpens = firstHalf.reduce((sum, d) => sum + d.opens, 0);
  const secondHalfOpens = secondHalf.reduce((sum, d) => sum + d.opens, 0);
  
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Eye className="h-4 w-4" />
          <span className="text-xs font-medium">Total Aberturas</span>
        </div>
        <p className="text-2xl font-bold">{totalOpens.toLocaleString()}</p>
        <TrendIndicator current={secondHalfOpens} previous={firstHalfOpens} label="vs período anterior" />
      </div>
      
      <div className="bg-success/5 rounded-lg p-3 border border-success/10">
        <div className="flex items-center gap-2 text-success mb-1">
          <MousePointerClick className="h-4 w-4" />
          <span className="text-xs font-medium">Total Cliques</span>
        </div>
        <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium">Média/dia</span>
        </div>
        <p className="text-2xl font-bold">{avgOpens}</p>
        <span className="text-xs text-muted-foreground">aberturas</span>
      </div>
      
      <div className="bg-violet-500/5 rounded-lg p-3 border border-violet-500/10">
        <div className="flex items-center gap-2 text-violet-500 mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">CTR</span>
        </div>
        <p className="text-2xl font-bold">{ctr}%</p>
        <span className="text-xs text-muted-foreground">click-through rate</span>
      </div>
    </motion.div>
  );
}

export function TrendChart() {
  const [activePeriod, setActivePeriod] = useState<"week" | "month">("week");
  const { data: weekData, isLoading: weekLoading } = useTrackingTrends(7);
  const { data: monthData, isLoading: monthLoading } = useTrackingTrends(30);

  const data = activePeriod === "week" ? weekData : monthData;
  const isLoading = activePeriod === "week" ? weekLoading : monthLoading;

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-[280px] w-full space-y-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      );
    }

    if (!data?.length || data.every(d => d.opens === 0 && d.clicks === 0)) {
      return (
        <motion.div 
          className="h-[280px] flex flex-col items-center justify-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-muted/50 rounded-full p-6">
              <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </div>
          <p className="mt-4 font-medium">Nenhum dado disponível</p>
          <p className="text-sm text-muted-foreground/70">Envie emails para ver as tendências</p>
        </motion.div>
      );
    }

    const maxValue = Math.max(
      ...data.map(d => Math.max(d.opens, d.clicks))
    );
    const avgOpens = data.reduce((sum, d) => sum + d.opens, 0) / data.length;

    return (
      <motion.div
        key={activePeriod}
        initial={{ opacity: 0, x: activePeriod === "week" ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendColorOpens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trendColorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              {/* Glow effect */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-muted/30" 
              vertical={false}
            />
            
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, Math.ceil(maxValue * 1.2)]}
              dx={-10}
            />
            
            {/* Average line */}
            <ReferenceLine 
              y={avgOpens} 
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="opens"
              name="opens"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#trendColorOpens)"
              filter="url(#glow)"
              dot={false}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />
            
            <Area
              type="monotone"
              dataKey="clicks"
              name="clicks"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              fill="url(#trendColorClicks)"
              dot={false}
              activeDot={{
                r: 6,
                stroke: "hsl(var(--success))",
                strokeWidth: 2,
                fill: "hsl(var(--background))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Stats summary */}
        <StatsSummary data={data} period={activePeriod === "week" ? 7 : 30} />
      </motion.div>
    );
  };

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendências de Engajamento
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activePeriod} onValueChange={(v) => setActivePeriod(v as "week" | "month")}>
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="week" className="text-xs h-6 px-3">7 dias</TabsTrigger>
              <TabsTrigger value="month" className="text-xs h-6 px-3">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30" />
            <span className="text-sm text-muted-foreground">Aberturas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success shadow-lg shadow-success/30" />
            <span className="text-sm text-muted-foreground">Cliques</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-6 h-0 border-t-2 border-dashed border-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">Média</span>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {renderChart()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
