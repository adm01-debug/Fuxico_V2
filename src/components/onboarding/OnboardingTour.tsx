import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useOnboarding } from '@/hooks/use-onboarding';
import { TourStep } from '@/lib/onboarding-config';

// ============================================
// SPOTLIGHT COMPONENT
// ============================================

interface SpotlightProps {
  target: string;
  padding?: number;
  isCenter?: boolean;
}

function Spotlight({ target, padding = 8, isCenter }: SpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isCenter) {
      setRect(null);
      return;
    }

    const element = document.querySelector(target);
    if (element) {
      const updateRect = () => {
        setRect(element.getBoundingClientRect());
      };
      
      updateRect();
      
      // Update on scroll/resize
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
      
      return () => {
        window.removeEventListener('scroll', updateRect, true);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, [target, isCenter]);

  if (isCenter || !rect) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        style={{ pointerEvents: 'none' }}
      />
    );
  }

  const spotlightStyle = {
    position: 'absolute' as const,
    top: rect.top - padding + window.scrollY,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    borderRadius: '8px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
    pointerEvents: 'none' as const,
    transition: 'all 0.3s ease-out',
  };

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      <div style={spotlightStyle} className="backdrop-blur-0" />
    </div>
  );
}

// ============================================
// TOOLTIP COMPONENT
// ============================================

interface TooltipProps {
  step: TourStep;
  target: string;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
  progress: number;
  isFirst: boolean;
  isLast: boolean;
}

function TourTooltip({
  step,
  target,
  onNext,
  onPrev,
  onSkip,
  currentStep,
  totalSteps,
  progress,
  isFirst,
  isLast,
}: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  useEffect(() => {
    if (step.position === 'center') {
      setPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
      return;
    }

    const element = document.querySelector(target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const margin = 16;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - margin + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('bottom');
        break;
      case 'bottom':
        top = rect.bottom + margin + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowPosition('top');
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - margin;
        setArrowPosition('right');
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + margin;
        setArrowPosition('left');
        break;
    }

    // Keep within viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    setPosition({ top, left });
  }, [step, target]);

  const isCenter = step.position === 'center';

  return (
    <div
      className={cn(
        "fixed z-[9999] bg-card border rounded-xl shadow-2xl transition-all duration-300",
        isCenter ? "transform -translate-x-1/2 -translate-y-1/2" : ""
      )}
      style={{
        top: position.top,
        left: position.left,
        width: isCenter ? '400px' : '360px',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* Arrow */}
      {!isCenter && (
        <div
          className={cn(
            "absolute w-3 h-3 bg-card border rotate-45",
            arrowPosition === 'top' && "-top-1.5 left-1/2 -translate-x-1/2 border-t border-l",
            arrowPosition === 'bottom' && "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
            arrowPosition === 'left' && "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b",
            arrowPosition === 'right' && "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t"
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-foreground">{step.title}</h3>
        <button
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {step.content}
        </p>
      </div>

      {/* Progress */}
      {step.showProgress !== false && totalSteps > 1 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Passo {currentStep + 1} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-4 pt-2 border-t">
        <div>
          {step.showSkip !== false && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Pular tour
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {step.prevLabel || 'Anterior'}
            </Button>
          )}
          <Button size="sm" onClick={onNext}>
            {step.nextLabel || (isLast ? 'Concluir' : 'Próximo')}
            {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OnboardingTour() {
  const {
    currentTour,
    currentStep,
    isActive,
    totalSteps,
    progress,
    nextStep,
    prevStep,
    skipTour,
  } = useOnboarding();

  if (!isActive || !currentTour) {
    return null;
  }

  const step = currentTour.steps[currentStep];
  if (!step) {
    return null;
  }

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCenter = step.position === 'center';

  return createPortal(
    <>
      <Spotlight
        target={step.target}
        padding={step.spotlightPadding}
        isCenter={isCenter}
      />
      <TourTooltip
        step={step}
        target={step.target}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
        currentStep={currentStep}
        totalSteps={totalSteps}
        progress={progress}
        isFirst={isFirst}
        isLast={isLast}
      />
    </>,
    document.body
  );
}

// ============================================
// TRIGGER BUTTON
// ============================================

interface TourTriggerProps {
  tourId: string;
  children?: React.ReactNode;
  className?: string;
}

export function TourTrigger({ tourId, children, className }: TourTriggerProps) {
  const { startTour, hasCompletedTour } = useOnboarding();
  const completed = hasCompletedTour(tourId);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTour(tourId)}
      className={cn("gap-2", className)}
    >
      {children || (
        <>
          <span>📖</span>
          {completed ? 'Rever Tour' : 'Iniciar Tour'}
        </>
      )}
    </Button>
  );
}
