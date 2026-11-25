import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Check, Sparkles, Rocket, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
import { createWizardSteps, type WizardStep } from './wizard-steps';
import { matchFirst } from '@/lib/variant';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const StepIndicator = ({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2 py-4">
    {steps.map((step, index) => (
      <motion.button
        key={step.id}
        onClick={() => index <= currentStep && onStepClick(index)}
        className={cn(
          'relative rounded-full transition-all duration-300',
          matchFirst(
            [
              [index === currentStep, () => 'h-3 w-10 bg-primary'],
              [
                index < currentStep,
                () => 'h-3 w-3 cursor-pointer bg-primary/60 hover:bg-primary/80',
              ],
            ],
            () => 'h-3 w-3 bg-muted-foreground/20'
          )
        )}
        whileHover={index < currentStep ? { scale: 1.2 } : {}}
        whileTap={index < currentStep ? { scale: 0.9 } : {}}
        aria-label={`Ir para passo ${index + 1}: ${step.title}`}
      >
        {index === currentStep && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            layoutId="activeStep"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        {index < currentStep && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="h-2 w-2 text-primary-foreground" />
          </motion.div>
        )}
      </motion.button>
    ))}
  </div>
);

const StepContent = ({ children, direction }: { children: React.ReactNode; direction: number }) => (
  <motion.div
    initial={{ opacity: 0, x: direction * 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -direction * 50 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  >
    {children}
  </motion.div>
);

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [preferences, setPreferences] = useState({
    notifyOnOpen: true,
    notifyOnClick: true,
    desktopNotifications: false,
    emailDigest: false,
    installExtension: false,
  });

  const steps = createWizardSteps(preferences, setPreferences);
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setShowCelebration(true);
      setTimeout(() => onComplete(), 1500);
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index < currentStep) {
      setDirection(-1);
      setCurrentStep(index);
    }
  };

  const wizardContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      {showCelebration && <Confetti trigger={showCelebration} duration={1500} />}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden border-primary/20 shadow-2xl">
          <div
            className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"
            style={{ width: `${progress}%` }}
          />
          <CardHeader className="pb-2 text-center">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                Passo {currentStep + 1} de {steps.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={onSkip}
                aria-label="Pular wizard"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <motion.div
              className="mb-4 flex justify-center"
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className={cn('rounded-2xl bg-gradient-to-br p-4', currentStepData.color)}>
                {currentStepData.icon}
              </div>
            </motion.div>
            <motion.div
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <CardDescription className="mt-1">{currentStepData.description}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="py-4">
            <AnimatePresence mode="wait">
              <StepContent key={currentStep} direction={direction}>
                {currentStepData.content}
              </StepContent>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/30 pt-4">
            <div>
              {!isFirstStep && (
                <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  Pular
                </Button>
              )}
              <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className={cn(
                    'min-w-[120px] gap-2',
                    isLastStep &&
                      'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
                  )}
                >
                  {isLastStep ? (
                    <>
                      Começar
                      <Rocket className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardFooter>
        </Card>
        <StepIndicator steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />
      </motion.div>
    </div>
  );

  return createPortal(wizardContent, document.body);
}

export default OnboardingWizard;
