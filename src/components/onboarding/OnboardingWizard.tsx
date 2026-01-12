// =============================================================================
// FUXICO - Enhanced Onboarding Wizard Component
// Premium wizard with animations, confetti, and gamification
// =============================================================================

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Eye,
  MousePointerClick,
  Bell,
  Chrome,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Rocket,
  X,
  Star,
  Trophy,
  Shield,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti, CelebrationBurst, PulseRing } from '@/components/ui/confetti';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  color: string;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Animated step indicator with pulse
const StepIndicator = ({ 
  steps, 
  currentStep, 
  onStepClick 
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
          "relative rounded-full transition-all duration-300",
          index === currentStep 
            ? "w-10 h-3 bg-primary" 
            : index < currentStep 
              ? "w-3 h-3 bg-primary/60 cursor-pointer hover:bg-primary/80" 
              : "w-3 h-3 bg-muted-foreground/20"
        )}
        whileHover={index < currentStep ? { scale: 1.2 } : {}}
        whileTap={index < currentStep ? { scale: 0.9 } : {}}
        aria-label={`Ir para passo ${index + 1}: ${step.title}`}
      >
        {index === currentStep && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary"
            layoutId="activeStep"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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

// Animated feature card
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  delay 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn(
      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300",
      "hover:shadow-lg hover:scale-105 cursor-default",
      `bg-gradient-to-br ${color}`
    )}
  >
    <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm">
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-sm font-medium text-center">{title}</span>
    <span className="text-xs text-muted-foreground text-center">{description}</span>
  </motion.div>
);

// Animated step content wrapper
const StepContent = ({ children, direction }: { children: React.ReactNode; direction: number }) => (
  <motion.div
    initial={{ opacity: 0, x: direction * 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -direction * 50 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao FUXICO! 🎉',
      description: 'O sistema mais completo de rastreamento de emails',
      icon: <Sparkles className="h-8 w-8" />,
      color: 'from-primary/20 to-primary/5',
      content: (
        <div className="space-y-6 text-center">
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <div className="relative">
              <PulseRing color="hsl(var(--primary))" size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                  <Mail className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold">Saiba exatamente quando seus emails são lidos</h3>
            <p className="text-muted-foreground">
              O FUXICO usa tecnologia de pixel invisível para rastrear aberturas e cliques 
              sem que o destinatário perceba.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-3 gap-3 pt-4">
            <FeatureCard
              icon={Eye}
              title="Aberturas"
              description="Saiba quando leem"
              color="from-blue-500/10 to-blue-500/5"
              delay={0.5}
            />
            <FeatureCard
              icon={MousePointerClick}
              title="Cliques"
              description="Monitore links"
              color="from-green-500/10 to-green-500/5"
              delay={0.6}
            />
            <FeatureCard
              icon={Bell}
              title="Alertas"
              description="Em tempo real"
              color="from-purple-500/10 to-purple-500/5"
              delay={0.7}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'how-it-works',
      title: 'Como Funciona',
      description: 'Entenda o processo de rastreamento',
      icon: <Zap className="h-8 w-8" />,
      color: 'from-yellow-500/20 to-yellow-500/5',
      content: (
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: 'Crie um rastreamento',
              description: 'Gere um pixel único para cada email',
              icon: <Mail className="h-5 w-5" />,
              color: 'from-blue-500 to-blue-600',
            },
            {
              step: 2,
              title: 'Adicione ao seu email',
              description: 'Insira o pixel ou use nossa extensão',
              icon: <Chrome className="h-5 w-5" />,
              color: 'from-green-500 to-green-600',
            },
            {
              step: 3,
              title: 'Receba notificações',
              description: 'Alertas em tempo real quando abrem',
              icon: <Bell className="h-5 w-5" />,
              color: 'from-purple-500 to-purple-600',
            },
          ].map((item, index) => (
            <motion.div 
              key={item.step} 
              className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <motion.div 
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold shadow-lg",
                  item.color
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {item.step}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.icon}</span>
                  <h4 className="font-semibold">{item.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Preferências de Notificação',
      description: 'Configure como deseja ser notificado',
      icon: <Bell className="h-8 w-8" />,
      color: 'from-blue-500/20 to-blue-500/5',
      content: (
        <div className="space-y-3">
          {[
            {
              id: 'notifyOnOpen',
              label: 'Notificar quando email for aberto',
              description: 'Receba um alerta a cada abertura',
              icon: Eye,
              checked: preferences.notifyOnOpen,
            },
            {
              id: 'notifyOnClick',
              label: 'Notificar quando link for clicado',
              description: 'Saiba quando clicam nos seus links',
              icon: MousePointerClick,
              checked: preferences.notifyOnClick,
            },
            {
              id: 'desktopNotifications',
              label: 'Notificações no desktop',
              description: 'Receba notificações mesmo fora do app',
              icon: Bell,
              checked: preferences.desktopNotifications,
            },
            {
              id: 'emailDigest',
              label: 'Resumo diário por email',
              description: 'Receba um resumo das atividades',
              icon: Mail,
              checked: preferences.emailDigest,
            },
          ].map((pref, index) => (
            <motion.div
              key={pref.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                pref.checked 
                  ? "bg-primary/5 border-primary/30" 
                  : "bg-muted/30 border-border/50 hover:border-primary/20"
              )}
              onClick={() => setPreferences(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof prev] }))}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                pref.checked ? "bg-primary/10" : "bg-muted"
              )}>
                <pref.icon className={cn("h-5 w-5", pref.checked ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1">
                <Label htmlFor={pref.id} className="font-medium cursor-pointer">
                  {pref.label}
                </Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Checkbox
                id={pref.id}
                checked={pref.checked}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, [pref.id]: checked }))
                }
                className="h-5 w-5"
              />
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      id: 'extension',
      title: 'Extensão do Chrome',
      description: 'Rastreie emails automaticamente no Gmail',
      icon: <Chrome className="h-8 w-8" />,
      color: 'from-green-500/20 to-green-500/5',
      content: (
        <div className="space-y-6 text-center">
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-2xl">
                <Chrome className="h-12 w-12 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold">Automatize seu rastreamento</h3>
            <p className="text-muted-foreground text-sm">
              Nossa extensão injeta automaticamente o pixel de rastreamento 
              em todos os emails que você envia pelo Gmail.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Check className="h-5 w-5" />
            <span className="font-medium">100% automático e invisível</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
              preferences.installExtension 
                ? "bg-primary/5 border-primary/30" 
                : "bg-muted/30 border-border/50 hover:border-primary/20"
            )}
            onClick={() => setPreferences((prev) => ({ ...prev, installExtension: !prev.installExtension }))}
          >
            <Checkbox
              id="installExtension"
              checked={preferences.installExtension}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, installExtension: !!checked }))
              }
              className="h-5 w-5"
            />
            <Label htmlFor="installExtension" className="flex-1 text-left cursor-pointer">
              <span className="font-medium">Quero instalar a extensão depois</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vamos te lembrar quando terminar o tour
              </p>
            </Label>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'ready',
      title: 'Tudo Pronto! 🚀',
      description: 'Você está pronto para começar',
      icon: <Rocket className="h-8 w-8" />,
      color: 'from-purple-500/20 to-purple-500/5',
      content: (
        <div className="space-y-6 text-center">
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <div className="relative">
              <CelebrationBurst isActive={true} />
              <motion.div 
                className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary), 0.4)",
                    "0 0 0 20px rgba(var(--primary), 0)",
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                >
                  <Trophy className="h-14 w-14 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Configuração concluída!
            </h3>
            <p className="text-muted-foreground text-sm">
              Suas preferências foram salvas. Agora você pode começar a rastrear 
              seus emails e ter total controle sobre suas comunicações.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 gap-3 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { icon: Mail, label: 'Emails ilimitados', value: '∞', color: 'from-blue-500/10 to-blue-500/5' },
              { icon: Zap, label: 'Tempo real', value: '⚡', color: 'from-yellow-500/10 to-yellow-500/5' },
              { icon: Shield, label: 'Dados seguros', value: '🔒', color: 'from-green-500/10 to-green-500/5' },
              { icon: BarChart3, label: 'Analytics', value: '📊', color: 'from-purple-500/10 to-purple-500/5' },
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                className={cn("p-3 rounded-xl bg-gradient-to-br", item.color)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Achievement badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          >
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">+50 XP - Primeira Configuração</span>
          </motion.div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setShowCelebration(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {showCelebration && <Confetti duration={1500} />}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-primary/20 overflow-hidden">
          {/* Gradient top border */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" style={{ width: `${progress}%` }} />
          
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="text-xs gap-1">
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
              className="flex justify-center mb-4"
              key={currentStep}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className={cn(
                "p-4 rounded-2xl bg-gradient-to-br",
                currentStepData.color
              )}>
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

          <CardFooter className="flex items-center justify-between gap-2 border-t pt-4 bg-muted/30">
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
                <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
                  Pular
                </Button>
              )}
              <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm" 
                  onClick={handleNext} 
                  className={cn(
                    "min-w-[120px] gap-2",
                    isLastStep && "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
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
        
        {/* Step indicators outside the card */}
        <StepIndicator 
          steps={steps} 
          currentStep={currentStep} 
          onStepClick={handleStepClick}
        />
      </motion.div>
    </div>
  );

  return createPortal(wizardContent, document.body);
}

export default OnboardingWizard;
