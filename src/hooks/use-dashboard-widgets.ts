/**
 * Hook para widgets personalizáveis do dashboard
 * @description Hook para widgets personalizáveis do dashboard. Inclui gerenciamento de estado e cache.
 * @returns Object com data, isLoading, error
 */
// =============================================================================
// Hook para gerenciar widgets customizáveis do dashboard
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';

export type WidgetType = 
  | 'realtime-metrics'
  | 'weekly-trends'
  | 'quick-actions'
  | 'bounce-alerts'
  | 'recent-events'
  | 'performance-gauge'
  | 'top-recipients'
  | 'delivery-stats';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'realtime-metrics',
    type: 'realtime-metrics',
    title: 'Métricas em Tempo Real',
    description: 'Acompanhe aberturas e cliques ao vivo',
    icon: 'Zap',
    size: 'large',
    enabled: true,
    order: 0,
  },
  {
    id: 'weekly-trends',
    type: 'weekly-trends',
    title: 'Tendências Semanais',
    description: 'Gráfico de desempenho dos últimos 7 dias',
    icon: 'TrendingUp',
    size: 'large',
    enabled: true,
    order: 1,
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Acesso rápido às principais funções',
    icon: 'Rocket',
    size: 'medium',
    enabled: true,
    order: 2,
  },
  {
    id: 'performance-gauge',
    type: 'performance-gauge',
    title: 'Performance Geral',
    description: 'Indicadores de saúde do email marketing',
    icon: 'Gauge',
    size: 'medium',
    enabled: true,
    order: 3,
  },
  {
    id: 'bounce-alerts',
    type: 'bounce-alerts',
    title: 'Alertas de Bounce',
    description: 'Monitore emails que falharam',
    icon: 'AlertTriangle',
    size: 'medium',
    enabled: true,
    order: 4,
  },
  {
    id: 'recent-events',
    type: 'recent-events',
    title: 'Eventos Recentes',
    description: 'Últimas interações com seus emails',
    icon: 'Activity',
    size: 'medium',
    enabled: true,
    order: 5,
  },
  {
    id: 'top-recipients',
    type: 'top-recipients',
    title: 'Top Destinatários',
    description: 'Contatos mais engajados',
    icon: 'Users',
    size: 'small',
    enabled: false,
    order: 6,
  },
  {
    id: 'delivery-stats',
    type: 'delivery-stats',
    title: 'Taxa de Entrega',
    description: 'Estatísticas de deliverability',
    icon: 'CheckCircle',
    size: 'small',
    enabled: false,
    order: 7,
  },
];

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useLocalStorage<DashboardWidget[]>(
    'dashboard-widgets',
    DEFAULT_WIDGETS
  );
  const [isEditing, setIsEditing] = useState(false);

  // Garantir que novos widgets padrão sejam adicionados
  useEffect(() => {
    const currentIds = widgets.map(w => w.id);
    const newWidgets = DEFAULT_WIDGETS.filter(w => !currentIds.includes(w.id));
    
    if (newWidgets.length > 0) {
      setWidgets([...widgets, ...newWidgets]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reordenar widgets diretamente (para framer-motion Reorder)
  const setWidgetOrder = useCallback((orderedWidgets: DashboardWidget[]) => {
    const updatedWidgets = orderedWidgets.map((w, i) => ({ ...w, order: i }));
    const disabled = widgets.filter(w => !w.enabled);
    setWidgets([...updatedWidgets, ...disabled]);
  }, [widgets, setWidgets]);

  const enabledWidgets = widgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev => 
      prev.map(w => 
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      )
    );
  }, [setWidgets]);

  const reorderWidgets = useCallback((startIndex: number, endIndex: number) => {
    setWidgets(prev => {
      const enabledList = prev.filter(w => w.enabled).sort((a, b) => a.order - b.order);
      const [removed] = enabledList.splice(startIndex, 1);
      enabledList.splice(endIndex, 0, removed);
      
      // Atualizar ordem
      const updatedEnabled = enabledList.map((w, i) => ({ ...w, order: i }));
      const disabled = prev.filter(w => !w.enabled);
      
      return [...updatedEnabled, ...disabled];
    });
  }, [setWidgets]);

  const resetWidgets = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, [setWidgets]);

  const updateWidgetSize = useCallback((widgetId: string, size: DashboardWidget['size']) => {
    setWidgets(prev =>
      prev.map(w =>
        w.id === widgetId ? { ...w, size } : w
      )
    );
  }, [setWidgets]);

  return {
    widgets,
    enabledWidgets,
    isEditing,
    setIsEditing,
    toggleWidget,
    reorderWidgets,
    setWidgetOrder,
    resetWidgets,
    updateWidgetSize,
  };
}
