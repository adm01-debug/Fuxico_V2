import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface TooltipWrapperProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipWrapper({ content, children, side = 'top' }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}><p>{content}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
