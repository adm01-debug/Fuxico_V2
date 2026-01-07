// =============================================================================
// FUXICO - Improved Tab Skeleton Components
// Skeletons mais sofisticados com animações e variações
// =============================================================================

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// =============================================================================
// SKELETON VARIANTS
// =============================================================================

interface SkeletonProps {
  className?: string;
}

// Skeleton para tabelas com linhas animadas
export function TableSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 animate-pulse" />
          <Skeleton className="h-9 w-28 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros/Search */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-[280px] animate-pulse" />
          <Skeleton className="h-10 w-[120px] animate-pulse" />
          <Skeleton className="h-10 w-[100px] animate-pulse" />
        </div>
        
        {/* Header da tabela */}
        <div className="grid grid-cols-5 gap-4 py-3 border-b">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-4 animate-pulse" 
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        
        {/* Linhas da tabela com stagger animation */}
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="grid grid-cols-5 gap-4 py-4 border-b border-border/50"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
                <Skeleton className="h-4 flex-1 animate-pulse" />
              </div>
              <Skeleton className="h-4 animate-pulse" />
              <Skeleton className="h-4 animate-pulse" />
              <Skeleton className="h-6 w-20 rounded-full animate-pulse" />
              <Skeleton className="h-4 w-24 animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Paginação */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-4 w-32 animate-pulse" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 animate-pulse" />
            <Skeleton className="h-9 w-9 animate-pulse" />
            <Skeleton className="h-9 w-9 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para cards de métricas
export function MetricsSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton 
                  className="h-4 w-24 animate-pulse" 
                  style={{ animationDelay: `${i * 100}ms` }}
                />
                <Skeleton 
                  className="h-8 w-20 animate-pulse" 
                  style={{ animationDelay: `${i * 100 + 50}ms` }}
                />
                <Skeleton 
                  className="h-3 w-16 animate-pulse" 
                  style={{ animationDelay: `${i * 100 + 100}ms` }}
                />
              </div>
              <Skeleton 
                className="h-12 w-12 rounded-xl animate-pulse" 
                style={{ animationDelay: `${i * 100}ms` }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton para gráficos
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40 animate-pulse" />
            <Skeleton className="h-4 w-56 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 animate-pulse" />
            <Skeleton className="h-9 w-24 animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
          {/* Barras do gráfico simuladas */}
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t animate-pulse"
              style={{ 
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${i * 50}ms` 
              }}
            />
          ))}
        </div>
        {/* Eixo X */}
        <div className="flex justify-between mt-4 pt-2 border-t">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8 animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para formulários
export function FormSkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <Skeleton className="h-7 w-48 animate-pulse" />
        <Skeleton className="h-4 w-72 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2" style={{ animationDelay: `${i * 100}ms` }}>
            <Skeleton className="h-4 w-24 animate-pulse" />
            <Skeleton className="h-10 w-full animate-pulse" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24 animate-pulse" />
          <Skeleton className="h-10 w-32 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para lista de eventos/atividades
export function ActivitySkeleton({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded animate-pulse" />
          <Skeleton className="h-6 w-40 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32 animate-pulse" />
              <Skeleton className="h-3 w-48 animate-pulse" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
              <Skeleton className="h-3 w-20 animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton para dashboard home
export function DashboardHomeSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40 animate-pulse" />
          <Skeleton className="h-4 w-64 animate-pulse" />
        </div>
        <Skeleton className="h-9 w-28 animate-pulse" />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-24 rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <MetricsSkeleton />

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartSkeleton className="lg:col-span-2" />
        <ActivitySkeleton />
      </div>
    </div>
  );
}

// Skeleton genérico para tabs
export default function TabSkeleton({ variant = 'table' }: { variant?: 'table' | 'metrics' | 'chart' | 'form' | 'activity' | 'dashboard' }) {
  switch (variant) {
    case 'metrics':
      return <MetricsSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'activity':
      return <ActivitySkeleton />;
    case 'dashboard':
      return <DashboardHomeSkeleton />;
    default:
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 animate-pulse" />
            <Skeleton className="h-10 w-32 animate-pulse" />
          </div>
          <TableSkeleton />
        </div>
      );
  }
}
