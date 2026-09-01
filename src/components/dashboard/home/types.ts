export interface RealtimeEvent {
  id: string;
  type: 'open' | 'click' | 'bounce' | 'document_view';
  email: string;
  subject?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BounceAlert {
  id: string;
  email: string;
  subject?: string;
  type: string;
  reason?: string;
  timestamp: string;
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  className?: string;
  gradient?: string;
  sparklineData?: number[];
}
