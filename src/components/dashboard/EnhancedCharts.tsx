// =============================================================================
// FUXICO - Enhanced Charts & Data Visualization
// Premium charts with animations, gradients, and interactivity
// =============================================================================

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

// Types
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number | undefined;
}

interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  className?: string;
}

interface ChartCardProps {
  title: string;
  description?: string;
  value?: string | number;
  trend?: number;
  trendLabel?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

// Custom gradient definitions
const GradientDefs = () => (
  <defs>
    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
    </linearGradient>
  </defs>
);

// Custom tooltip type
interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-popover border border-border rounded-lg shadow-xl p-3"
      >
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

// Trend indicator component
export function TrendIndicator({ value, suffix = '%', className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        isPositive && 'text-green-600',
        !isPositive && !isNeutral && 'text-red-600',
        isNeutral && 'text-muted-foreground',
        className
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-4 w-4" />
      ) : isNeutral ? (
        <Minus className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      <span>
        {isPositive && '+'}
        {value}
        {suffix}
      </span>
    </div>
  );
}

// Chart card wrapper
export function ChartCard({
  title,
  description,
  value,
  trend,
  trendLabel,
  children,
  className,
  actions,
}: ChartCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {actions}
        </div>
        {(value !== undefined || trend !== undefined) && (
          <div className="flex items-end gap-3 mt-2">
            {value !== undefined && (
              <motion.span
                className="text-3xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {value}
              </motion.span>
            )}
            {trend !== undefined && (
              <div className="flex flex-col mb-1">
                <TrendIndicator value={trend} />
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// Area chart with gradient
interface AreaChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: 'primary' | 'success' | 'warning';
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

export const EnhancedAreaChart = memo(function EnhancedAreaChart({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 200,
  color = 'primary',
  showGrid = true,
  showXAxis = true,
  showYAxis = false,
}: AreaChartProps) {
  const colorMap = {
    primary: 'hsl(var(--primary))',
    success: '#22c55e',
    warning: '#f59e0b',
  };

  const gradientMap = {
    primary: 'url(#colorPrimary)',
    success: 'url(#colorSuccess)',
    warning: 'url(#colorWarning)',
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <GradientDefs />
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
        )}
        {showXAxis && (
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            className="text-xs fill-muted-foreground"
          />
        )}
        {showYAxis && (
          <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
        )}
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={colorMap[color]}
          strokeWidth={2}
          fill={gradientMap[color]}
          dot={false}
          activeDot={{
            r: 6,
            fill: colorMap[color],
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// Bar chart with animations
interface BarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  color?: string;
  showGrid?: boolean;
  horizontal?: boolean;
}

export const EnhancedBarChart = memo(function EnhancedBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 200,
  color = 'hsl(var(--primary))',
  showGrid = true,
  horizontal = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted/30"
            horizontal={!horizontal}
            vertical={horizontal}
          />
        )}
        {horizontal ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Donut/Pie chart
interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export const EnhancedDonutChart = memo(function EnhancedDonutChart({
  data,
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                style={{
                  transition: 'all 0.2s ease',
                  transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {centerValue && (
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {centerValue}
              </motion.div>
            )}
            {centerLabel && (
              <div className="text-xs text-muted-foreground">{centerLabel}</div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((entry, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-sm transition-opacity',
                activeIndex !== null && activeIndex !== index && 'opacity-50'
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Sparkline mini chart
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showDot?: boolean;
}

export const Sparkline = memo(function Sparkline({
  data,
  color = 'hsl(var(--primary))',
  height = 40,
  showDot = true,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={
            showDot
              ? {
                  r: 4,
                  fill: color,
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2,
                }
              : false
          }
        />
        <Tooltip content={<CustomTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );
});

// Stat card with sparkline
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export function StatCard({
  title,
  value,
  trend,
  trendLabel,
  sparklineData,
  icon,
  color = 'primary',
}: StatCardProps) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      stroke: 'hsl(var(--primary))',
    },
    success: {
      bg: 'bg-green-500/10',
      text: 'text-green-600',
      stroke: '#22c55e',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-600',
      stroke: '#f59e0b',
    },
    destructive: {
      bg: 'bg-red-500/10',
      text: 'text-red-600',
      stroke: '#ef4444',
    },
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <motion.p
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {value}
            </motion.p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                <TrendIndicator value={trend} className="text-xs" />
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn('p-2 rounded-lg', colorMap[color].bg)}>
              <div className={colorMap[color].text}>{icon}</div>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 -mx-4 -mb-4 px-4 pb-4 pt-2 bg-muted/30">
            <Sparkline data={sparklineData} color={colorMap[color].stroke} height={50} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Time range selector
interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ label: string; value: string }>;
}

export function TimeRangeSelector({
  value,
  onChange,
  options = [
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '90d', value: '90d' },
    { label: '1a', value: '1y' },
  ],
}: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-7 px-3 text-xs',
            value === option.value && 'shadow-sm'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export default ChartCard;
