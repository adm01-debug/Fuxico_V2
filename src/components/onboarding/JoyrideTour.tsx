/**
 * @fileoverview Tour de onboarding com react-joyride
 * @description Guia interativo para novos usuários do FUXICO
 */

import { useCallback, useState } from 'react';
import Joyride from 'react-joyride';
import type { CallBackProps, TooltipRenderProps } from 'react-joyride';
import { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ChevronLeft, ChevronRight, SkipForward, Sparkles, HelpCircle } from 'lucide-react';
import { tourStepsMap, tourLabels } from './tour-steps';

// =============================================================================
// TIPOS
// =============================================================================

import type { TourState } from '@/hooks/use-onboarding-tour';

// =============================================================================
// TOOLTIP CUSTOMIZADO
// =============================================================================

function CustomTooltip({
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

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
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

  const steps = tourStepsMap[tourState.tourId] || tourStepsMap.dashboard;

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

// =============================================================================
// SELETOR DE TOUR
// =============================================================================

interface TourSelectorProps {
  onStartTour: (tourId: string) => void;
  completedTours: string[];
  className?: string;
}

export function TourSelector({ onStartTour, completedTours, className }: TourSelectorProps) {
  const [selectedTour, setSelectedTour] = useState<string>('');

  const handleStart = () => {
    if (selectedTour) {
      onStartTour(selectedTour);
      setSelectedTour('');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedTour} onValueChange={setSelectedTour}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Escolher tour..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(tourLabels).map(([id, label]) => (
            <SelectItem key={id} value={id}>
              <div className="flex items-center gap-2">
                <span>{label}</span>
                {completedTours.includes(id) && (
                  <span className="text-xs text-green-500">✓</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={handleStart}
        disabled={!selectedTour}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        Iniciar
      </Button>
    </div>
  );
}
