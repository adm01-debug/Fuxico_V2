import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { 
  Mail, 
  MailOpen, 
  MousePointerClick, 
  AlertTriangle, 
  Clock, 
  Reply,
  type LucideIcon 
} from 'lucide-react'

const emailStatusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200',
  {
    variants: {
      status: {
        sent: 'bg-email-sent/10 text-email-sent border border-email-sent/20',
        delivered: 'bg-email-delivered/10 text-email-delivered border border-email-delivered/20',
        opened: 'bg-email-opened/10 text-email-opened border border-email-opened/20',
        clicked: 'bg-email-clicked/10 text-email-clicked border border-email-clicked/20',
        bounced: 'bg-email-bounced/10 text-email-bounced border border-email-bounced/20',
        pending: 'bg-email-pending/10 text-email-pending border border-email-pending/20',
        replied: 'bg-email-replied/10 text-email-replied border border-email-replied/20',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        default: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      status: 'sent',
      size: 'default',
    },
  }
)

import { CheckCircle } from 'lucide-react'

const statusIcons: Record<string, LucideIcon> = {
  sent: Mail,
  delivered: CheckCircle,
  opened: MailOpen,
  clicked: MousePointerClick,
  bounced: AlertTriangle,
  pending: Clock,
  replied: Reply,
}

const statusLabels: Record<string, string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  opened: 'Aberto',
  clicked: 'Clicado',
  bounced: 'Bounce',
  pending: 'Pendente',
  replied: 'Respondido',
}

export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'pending' | 'replied';

export interface EmailStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof emailStatusBadgeVariants> {
  status?: EmailStatus;
  showIcon?: boolean
  showLabel?: boolean
  customLabel?: string
  pulse?: boolean
  bounceType?: string
  bounceReason?: string
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function EmailStatusBadge({
  className,
  status,
  size,
  showIcon = true,
  showLabel = true,
  customLabel,
  pulse = false,
  bounceType,
  bounceReason,
  ...props
}: EmailStatusBadgeProps) {
  const Icon = status ? statusIcons[status] : Mail
  const label = customLabel || (status ? statusLabels[status] : 'Enviado')

  const badge = (
    <span
      className={cn(
        emailStatusBadgeVariants({ status, size }),
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {showLabel && <span>{label}</span>}
    </span>
  )

  // Show tooltip for bounced emails with reason
  if (status === 'bounced' && (bounceType || bounceReason)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Email não entregue</p>
            {bounceType && <p className="text-xs">Tipo: {bounceType}</p>}
            {bounceReason && <p className="text-xs max-w-48">{bounceReason}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

// Engagement Score Badge
const engagementBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      level: {
        hot: 'bg-engagement-hot/10 text-engagement-hot border border-engagement-hot/20',
        warm: 'bg-engagement-warm/10 text-engagement-warm border border-engagement-warm/20',
        cold: 'bg-engagement-cold/10 text-engagement-cold border border-engagement-cold/20',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        default: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      level: 'cold',
      size: 'default',
    },
  }
)

const engagementLabels: Record<string, string> = {
  hot: '🔥 Quente',
  warm: '⚡ Morno',
  cold: '❄️ Frio',
}

export interface EngagementBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof engagementBadgeVariants> {
  customLabel?: string
}

export function EngagementBadge({
  className,
  level,
  size,
  customLabel,
  ...props
}: EngagementBadgeProps) {
  const label = customLabel || (level ? engagementLabels[level] : 'Frio')

  return (
    <span
      className={cn(engagementBadgeVariants({ level, size }), className)}
      {...props}
    >
      {label}
    </span>
  )
}
