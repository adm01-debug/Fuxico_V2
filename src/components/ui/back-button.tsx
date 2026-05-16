import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper'

interface BackButtonProps {
  onClick: () => void
  label?: string
  className?: string
  showLabel?: boolean
}

export function BackButton({ 
  onClick, 
  label = 'Voltar', 
  className,
  showLabel = false 
}: BackButtonProps) {
  return (
    <TooltipWrapper content={label} shortcut="Esc">
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        onClick={onClick}
        className={cn(
          "h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-200 group",
          showLabel && "w-auto px-3 gap-2",
          className
        )}
        aria-label={label}
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        {showLabel && <span className="text-sm font-medium">{label}</span>}
      </Button>
    </TooltipWrapper>
  )
}
