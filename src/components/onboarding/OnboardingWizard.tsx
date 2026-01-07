// =============================================================================
// FUXICO - Onboarding Wizard Component
// Wizard de primeiro acesso com configuração guiada
// =============================================================================

import { useState } from 'react';
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
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Rocket,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
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
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Saiba exatamente quando seus emails são lidos</h3>
            <p className="text-muted-foreground">
              O FUXICO usa tecnologia de pixel invisível para rastrear aberturas e cliques 
              sem que o destinatário perceba.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Eye className="h-6 w-6 text-email-opened" />
              <span className="text-sm font-medium">Aberturas</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <MousePointerClick className="h-6 w-6 text-email-clicked" />
              <span className="text-sm font-medium">Cliques</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Alertas</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'how-it-works',
      title: 'Como Funciona',
      description: 'Entenda o processo de rastreamento',
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Crie um rastreamento',
                description: 'Gere um pixel único para cada email que deseja rastrear',
                icon: <Mail className="h-5 w-5" />,
              },
              {
                step: 2,
                title: 'Adicione ao seu email',
                description: 'Insira o pixel invisível no corpo do email (ou use nossa extensão)',
                icon: <Chrome className="h-5 w-5" />,
              },
              {
                step: 3,
                title: 'Receba notificações',
                description: 'Seja notificado em tempo real quando o email for aberto',
                icon: <Bell className="h-5 w-5" />,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Preferências de Notificação',
      description: 'Configure como deseja ser notificado',
      icon: <Bell className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          {[
            {
              id: 'notifyOnOpen',
              label: 'Notificar quando email for aberto',
              description: 'Receba um alerta a cada abertura',
              checked: preferences.notifyOnOpen,
            },
            {
              id: 'notifyOnClick',
              label: 'Notificar quando link for clicado',
              description: 'Saiba quando clicam nos seus links',
              checked: preferences.notifyOnClick,
            },
            {
              id: 'desktopNotifications',
              label: 'Notificações no desktop',
              description: 'Receba notificações mesmo fora do navegador',
              checked: preferences.desktopNotifications,
            },
            {
              id: 'emailDigest',
              label: 'Resumo diário por email',
              description: 'Receba um resumo das atividades do dia',
              checked: preferences.emailDigest,
            },
          ].map((pref) => (
            <div
              key={pref.id}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={pref.id}
                checked={pref.checked}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, [pref.id]: checked }))
                }
                className="mt-1"
              />
              <Label htmlFor={pref.id} className="flex-1 cursor-pointer">
                <span className="font-medium">{pref.label}</span>
                <p className="text-sm text-muted-foreground">{pref.description}</p>
              </Label>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'extension',
      title: 'Extensão do Chrome',
      description: 'Rastreie emails automaticamente no Gmail',
      icon: <Chrome className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Chrome className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Automatize seu rastreamento</h3>
            <p className="text-muted-foreground">
              Nossa extensão do Chrome injeta automaticamente o pixel de rastreamento 
              em todos os emails que você envia pelo Gmail.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
            <Check className="h-5 w-5" />
            <span className="font-medium">100% automático e invisível</span>
          </div>
          <div
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() =>
              setPreferences((prev) => ({ ...prev, installExtension: !prev.installExtension }))
            }
          >
            <Checkbox
              id="installExtension"
              checked={preferences.installExtension}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, installExtension: !!checked }))
              }
            />
            <Label htmlFor="installExtension" className="flex-1 text-left cursor-pointer">
              <span className="font-medium">Quero instalar a extensão depois</span>
              <p className="text-sm text-muted-foreground">
                Vamos te lembrar de instalar quando terminar o tour
              </p>
            </Label>
          </div>
        </div>
      ),
    },
    {
      id: 'ready',
      title: 'Tudo Pronto! 🚀',
      description: 'Você está pronto para começar',
      icon: <Rocket className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center animate-bounce-in">
              <Check className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Configuração concluída!</h3>
            <p className="text-muted-foreground">
              Suas preferências foram salvas. Agora você pode começar a rastrear 
              seus emails e ter total controle sobre suas comunicações.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">∞</p>
              <p className="text-sm text-muted-foreground">Emails ilimitados</p>
            </div>
            <div className="p-3 bg-email-opened/10 rounded-lg">
              <p className="text-2xl font-bold text-email-opened">⚡</p>
              <p className="text-sm text-muted-foreground">Tempo real</p>
            </div>
          </div>
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
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const wizardContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-scale-in border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              Passo {currentStep + 1} de {steps.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onSkip}
              aria-label="Pular wizard"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-muted rounded-xl">{currentStepData.icon}</div>
          </div>
          <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
          <Progress value={progress} className="h-1 mt-4" />
        </CardHeader>

        <CardContent className="py-6">{currentStepData.content}</CardContent>

        <CardFooter className="flex items-center justify-between gap-2 border-t pt-4">
          <div>
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
                Pular configuração
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="min-w-[120px]">
              {isLastStep ? (
                <>
                  Começar a usar
                  <Rocket className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Step indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              index === currentStep 
                ? "w-6 bg-primary" 
                : index < currentStep 
                  ? "w-2 bg-primary/60" 
                  : "w-2 bg-white/30"
            )}
            aria-label={`Ir para passo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(wizardContent, document.body);
}

export default OnboardingWizard;
