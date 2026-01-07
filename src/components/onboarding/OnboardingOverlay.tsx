// =============================================================================
// FUXICO - Onboarding Overlay Component
// Componente de overlay para o tour de onboarding
// =============================================================================

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, SkipForward, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourStep } from '@/lib/onboarding-config';

interface OnboardingOverlayProps {
  step: TourStep;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function OnboardingOverlay({
  step,
  stepNumber,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onClose,
  isFirstStep,
  isLastStep,
}: OnboardingOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Find and highlight target element
  useEffect(() => {
    if (step.target === 'body' || step.position === 'center') {
      setTargetRect(null);
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step.target, step.position]);

  // Calculate card position
  useEffect(() => {
    if (!cardRef.current) return;

    const cardRect = cardRef.current.getBoundingClientRect();
    const padding = step.spotlightPadding || 8;
    const margin = 16;

    if (!targetRect || step.position === 'center') {
      // Center in viewport
      setCardPosition({
        top: window.innerHeight / 2 - cardRect.height / 2,
        left: window.innerWidth / 2 - cardRect.width / 2,
      });
      return;
    }

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = targetRect.top - cardRect.height - margin - padding;
        left = targetRect.left + targetRect.width / 2 - cardRect.width / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin + padding;
        left = targetRect.left + targetRect.width / 2 - cardRect.width / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - cardRect.height / 2;
        left = targetRect.left - cardRect.width - margin - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - cardRect.height / 2;
        left = targetRect.right + margin + padding;
        break;
    }

    // Keep within viewport bounds
    top = Math.max(margin, Math.min(top, window.innerHeight - cardRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - cardRect.width - margin));

    setCardPosition({ top, left });
  }, [targetRect, step.position, step.spotlightPadding]);

  const overlayContent = (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tour de onboarding">
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300">
        {targetRect && (
          <div
            className="absolute bg-transparent transition-all duration-300"
            style={{
              top: targetRect.top - (step.spotlightPadding || 8),
              left: targetRect.left - (step.spotlightPadding || 8),
              width: targetRect.width + (step.spotlightPadding || 8) * 2,
              height: targetRect.height + (step.spotlightPadding || 8) * 2,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
            }}
          />
        )}
      </div>

      {/* Spotlight ring animation */}
      {targetRect && (
        <div
          className="absolute pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - (step.spotlightPadding || 8) - 4,
            left: targetRect.left - (step.spotlightPadding || 8) - 4,
            width: targetRect.width + (step.spotlightPadding || 8) * 2 + 8,
            height: targetRect.height + (step.spotlightPadding || 8) * 2 + 8,
            border: '2px solid hsl(var(--primary))',
            borderRadius: '12px',
          }}
        />
      )}

      {/* Tour card */}
      <Card
        ref={cardRef}
        className={cn(
          "absolute w-[90vw] max-w-md shadow-2xl animate-scale-in",
          "border-primary/20 bg-background/95 backdrop-blur-sm"
        )}
        style={{
          top: cardPosition.top,
          left: cardPosition.left,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Fechar tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {(step.showProgress !== false) && (
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progress} className="h-1.5 flex-1" />
              <Badge variant="secondary" className="text-xs">
                {stepNumber}/{totalSteps}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {step.content}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 pt-0">
          <div>
            {step.showSkip !== false && !isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Pular tour
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {step.prevLabel || 'Anterior'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              className="min-w-[100px]"
            >
              {step.nextLabel || (isLastStep ? 'Concluir' : 'Próximo')}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/60 text-xs">
        <span>← → Navegar</span>
        <span>Enter Avançar</span>
        <span>Esc Sair</span>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}

export default OnboardingOverlay;
