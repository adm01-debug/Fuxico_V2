/**
 * @fileoverview Tour de onboarding com react-joyride
 * @description Guia interativo para novos usuários do FUXICO
 */

import { useState, useCallback, useEffect } from 'react';
import Joyride, { 
  CallBackProps, 
  STATUS, 
  Step, 
  TooltipRenderProps,
  ACTIONS,
  EVENTS,
} from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, SkipForward, Sparkles } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/logger';

// =============================================================================
// TIPOS
// =============================================================================

interface TourState {
  run: boolean;
  stepIndex: number;
  tourId: string;
}

// =============================================================================
// PASSOS DO TOUR
// =============================================================================

const dashboardSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: '🎉 Bem-vindo ao FUXICO!',
    content: 'O sistema completo de rastreamento de emails. Vamos fazer um tour rápido pelas principais funcionalidades!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Começar!', back: 'Voltar', close: 'Fechar' },
  },
  {
    target: '[data-tour="stats-cards"]',
    placement: 'bottom',
    title: '📊 Métricas em Tempo Real',
    content: 'Aqui você vê um resumo completo: total de emails, aberturas, cliques e taxa de bounce. Todas as métricas são atualizadas em tempo real.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="trend-chart"]',
    placement: 'top',
    title: '📈 Gráfico de Tendências',
    content: 'Visualize a evolução das aberturas e cliques ao longo da semana. Identifique padrões e melhore suas campanhas.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="realtime-events"]',
    placement: 'left',
    title: '⚡ Atividade em Tempo Real',
    content: 'Acompanhe cada abertura e clique no momento em que acontece. Perfeito para acompanhar campanhas importantes!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tabs"]',
    placement: 'bottom',
    title: '📑 Navegação por Abas',
    content: 'Explore todas as funcionalidades: Emails, Links, Documentos, Relatórios, Analytics, Lead Scoring, e muito mais!',
    disableBeacon: true,
  },
  {
    target: '[data-tour="emails-tab"]',
    placement: 'bottom',
    title: '📧 Emails Rastreados',
    content: 'Clique aqui para ver todos os emails que você está rastreando. Cada email mostra status, aberturas e cliques.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="links-tab"]',
    placement: 'bottom',
    title: '🔗 Links Rastreáveis',
    content: 'Crie links com tracking para usar em qualquer lugar - redes sociais, WhatsApp, ou emails externos.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="analytics-tab"]',
    placement: 'bottom',
    title: '📊 Analytics Avançado',
    content: 'Análises detalhadas com gráficos interativos, segmentação por domínio, e insights de engajamento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leads-tab"]',
    placement: 'bottom',
    title: '🔥 Lead Scoring',
    content: 'Identifique seus contatos mais engajados automaticamente. O sistema calcula um score baseado em aberturas e cliques.',
    disableBeacon: true,
  },
  {
    target: 'body',
    placement: 'center',
    title: '🚀 Pronto para Começar!',
    content: 'Agora você conhece as principais funcionalidades do FUXICO. Dica: instale nossa extensão do Chrome para rastrear emails do Gmail automaticamente!',
    disableBeacon: true,
    locale: { skip: 'Pular', next: 'Concluir', back: 'Voltar', close: 'Fechar' },
  },
];

// =============================================================================
// TOOLTIP CUSTOMIZADO
// =============================================================================

function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;
  const isFirst = index === 0;
  const isCenter = step.placement === 'center';

  return (
    <div
      {...tooltipProps}
      className="bg-card border border-border rounded-xl shadow-2xl max-w-md animate-in fade-in-0 zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {typeof step.title === 'string' ? step.title : 'Tour'}
          </h3>
        </div>
        <button
          {...closeProps}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>
      </div>

      {/* Progress */}
      {size > 1 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Passo {index + 1} de {size}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-4 pt-2 border-t border-border">
        <div>
          {!isLastStep && (
            <Button
              {...skipProps}
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1"
            >
              <SkipForward className="h-4 w-4" />
              Pular tour
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button {...backProps} variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
          <Button {...primaryProps} size="sm" className="gap-1">
            {isLastStep ? 'Concluir' : 'Próximo'}
            {!isLastStep && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HOOK DO TOUR
// =============================================================================

export function useOnboardingTour() {
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('fuxico-completed-tours', []);
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
    tourId: '',
  });

  const startTour = useCallback((tourId: string = 'dashboard') => {
    setTourState({
      run: true,
      stepIndex: 0,
      tourId,
    });
  }, []);

  const stopTour = useCallback(() => {
    setTourState(prev => ({ ...prev, run: false }));
  }, []);

  const completeTour = useCallback((tourId: string) => {
    if (!completedTours.includes(tourId)) {
      setCompletedTours([...completedTours, tourId]);
    }
    stopTour();
  }, [completedTours, setCompletedTours, stopTour]);

  const resetTour = useCallback((tourId: string) => {
    setCompletedTours(completedTours.filter(id => id !== tourId));
  }, [completedTours, setCompletedTours]);

  const resetAllTours = useCallback(() => {
    setCompletedTours([]);
  }, [setCompletedTours]);

  const hasCompletedTour = useCallback((tourId: string) => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  // Auto-start tour for new users
  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !hasCompletedTour('dashboard')) {
          // Wait for page to render
          setTimeout(() => {
            startTour('dashboard');
          }, 1500);
        }
      } catch (error) {
        log.error('Error checking new user for tour:', error);
      }
    };

    checkNewUser();
  }, [hasCompletedTour, startTour]);

  return {
    tourState,
    startTour,
    stopTour,
    completeTour,
    resetTour,
    resetAllTours,
    hasCompletedTour,
    setTourState,
  };
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface JoyrideTourProps {
  tourState: TourState;
  setTourState: React.Dispatch<React.SetStateAction<TourState>>;
  onComplete?: (tourId: string) => void;
}

export function JoyrideTour({ tourState, setTourState, onComplete }: JoyrideTourProps) {
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      onComplete?.(tourState.tourId);
      setTourState(prev => ({ ...prev, run: false, stepIndex: 0 }));
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index for next/back
      setTourState(prev => ({
        ...prev,
        stepIndex: index + (action === ACTIONS.PREV ? -1 : 1),
      }));
    }
  }, [tourState.tourId, onComplete, setTourState]);

  const steps = tourState.tourId === 'dashboard' ? dashboardSteps : dashboardSteps;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={tourState.run}
      stepIndex={tourState.stepIndex}
      steps={steps}
      scrollToFirstStep
      showProgress
      showSkipButton
      disableScrolling={false}
      spotlightClicks={false}
      disableOverlayClose
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
        },
        spotlight: {
          borderRadius: 12,
        },
        overlay: {
          backdropFilter: 'blur(2px)',
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}

// =============================================================================
// BOTÃO DE INICIAR TOUR
// =============================================================================

interface TourTriggerButtonProps {
  onClick: () => void;
  hasCompleted: boolean;
  className?: string;
}

export function TourTriggerButton({ onClick, hasCompleted, className }: TourTriggerButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`gap-2 ${className}`}
    >
      <Sparkles className="h-4 w-4" />
      {hasCompleted ? 'Rever Tour' : 'Iniciar Tour'}
    </Button>
  );
}
