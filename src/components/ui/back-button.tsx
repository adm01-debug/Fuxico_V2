import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function BackButton({
  onClick,
  label = 'Voltar',
  className,
  showLabel = false,
}: BackButtonProps) {
  return (
    <TooltipWrapper content={label} shortcut="Esc">
      <Button
        variant="ghost"
        size={showLabel ? 'sm' : 'icon'}
        onClick={onClick}
        className={cn(
          'group h-9 w-9 rounded-full transition-all duration-200 hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-10',
          showLabel && 'w-auto gap-2 px-3',
          className
        )}
        aria-label={label}
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        {showLabel && <span className="text-sm font-medium">{label}</span>}
      </Button>
    </TooltipWrapper>
  );
}
