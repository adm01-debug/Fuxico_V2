import React, { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnimatedMetricProps {
  value: number
  previousValue?: number
  format?: 'number' | 'percent' | 'currency'
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  showTrend?: boolean
  size?: 'sm' | 'default' | 'lg' | 'xl'
}

function formatValue(value: number, format: string, prefix?: string, suffix?: string): string {
  let formatted: string

  switch (format) {
    case 'percent':
      formatted = `${value.toFixed(1)}%`
      break
    case 'currency':
      formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
      break
    default:
      formatted = new Intl.NumberFormat('pt-BR').format(Math.round(value))
  }

  return `${prefix || ''}${formatted}${suffix || ''}`
}

export function AnimatedMetric({
  value,
  previousValue,
  format = 'number',
  prefix,
  suffix,
  duration = 1000,
  className,
  showTrend = true,
  size = 'default',
}: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Calculate trend
  const trend = previousValue !== undefined ? value - previousValue : 0
  const trendPercent = previousValue && previousValue !== 0 
    ? ((value - previousValue) / previousValue) * 100 
    : 0

  // Animate on mount or value change
  useEffect(() => {
    const startValue = hasAnimated ? displayValue : 0
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      
      const current = startValue + (value - startValue) * easeOutExpo
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setHasAnimated(true)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  const sizeClasses = {
    sm: 'text-lg font-semibold',
    default: 'text-2xl font-bold',
    lg: 'text-3xl font-bold',
    xl: 'text-4xl font-bold',
  }

  const trendSizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  return (
    <div ref={ref} className={cn('flex flex-col', className)}>
      <span 
        className={cn(
          sizeClasses[size],
          'tabular-nums tracking-tight transition-all duration-300'
        )}
      >
        {formatValue(displayValue, format, prefix, suffix)}
      </span>
      
      {showTrend && previousValue !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            trendSizeClasses[size],
            trend > 0 && 'text-success',
            trend < 0 && 'text-destructive',
            trend === 0 && 'text-muted-foreground'
          )}
        >
          {trend > 0 && <TrendingUp className="h-3 w-3" />}
          {trend < 0 && <TrendingDown className="h-3 w-3" />}
          {trend === 0 && <Minus className="h-3 w-3" />}
          <span>
            {trend > 0 && '+'}
            {trendPercent.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Animated Counter (simpler version)
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 800, className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const startTime = performance.now()
    const startValue = count

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setCount(Math.round(startValue + (value - startValue) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span className={cn('tabular-nums', className)}>{count.toLocaleString('pt-BR')}</span>
}

// Pulse animation for notifications
export function PulseIndicator({ 
  active = true, 
  color = 'bg-primary',
  size = 'default' 
}: { 
  active?: boolean
  color?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2 w-2',
    lg: 'h-3 w-3',
  }

  if (!active) return null

  return (
    <span className="relative flex">
      <span
        className={cn(
          'absolute inline-flex rounded-full opacity-75 animate-ping',
          sizeClasses[size],
          color
        )}
      />
      <span
        className={cn('relative inline-flex rounded-full', sizeClasses[size], color)}
      />
    </span>
  )
}

// Skeleton with shimmer effect
export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'before:absolute before:inset-0',
        'before:-translate-x-full before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
    />
  )
}
