import { getRelativeTime } from '@/lib/date-utils';
import { TooltipWrapper } from './tooltip-wrapper';
import { formatDateTime } from '@/lib/date-utils';

interface TimeAgoProps {
  date: string | Date;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    <TooltipWrapper content={formatDateTime(d)}>
      <span className={className}>{getRelativeTime(d)}</span>
    </TooltipWrapper>
  );
}
