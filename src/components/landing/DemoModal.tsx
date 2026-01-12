import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Eye,
  MousePointerClick,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  FileText,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const demoSteps = [
  {
    id: 1,
    title: "Envie um Email Rastreado",
    description:
      "Ao compor seu email no Gmail, o FUXICO automaticamente adiciona um pixel de rastreamento invisível. O destinatário não percebe nada!",
    icon: Mail,
    visual: (
      <div className="relative p-6 bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-2xl border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="h-3 bg-muted rounded w-3/4 mb-2" />
            <div className="h-2 bg-muted/50 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-muted/50 rounded w-full" />
          <div className="h-2 bg-muted/50 rounded w-5/6" />
          <div className="h-2 bg-muted/50 rounded w-4/6" />
        </div>
        <motion.div
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-primary/20 rounded-full text-xs font-medium text-primary flex items-center gap-1.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-primary" />
          Rastreamento Ativo
        </motion.div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Destinatário Abre o Email",
    description:
      "Quando o destinatário abre seu email, o FUXICO registra instantaneamente a abertura com data, hora, localização e dispositivo.",
    icon: Eye,
    visual: (
      <div className="relative p-6 bg-gradient-to-br from-green-500/10 to-emerald-400/10 rounded-2xl border border-green-500/20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center justify-center mb-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-card/50 rounded-lg">
            <div className="text-sm font-semibold">Hora</div>
            <div className="text-xs text-muted-foreground">14:32:45</div>
          </div>
          <div className="p-3 bg-card/50 rounded-lg">
            <div className="text-sm font-semibold">Local</div>
            <div className="text-xs text-muted-foreground">São Paulo, BR</div>
          </div>
          <div className="p-3 bg-card/50 rounded-lg">
            <div className="text-sm font-semibold">Dispositivo</div>
            <div className="text-xs text-muted-foreground">Desktop</div>
          </div>
          <div className="p-3 bg-card/50 rounded-lg">
            <div className="text-sm font-semibold">Browser</div>
            <div className="text-xs text-muted-foreground">Chrome</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Receba Notificação Instantânea",
    description:
      "Você recebe uma notificação em tempo real no seu navegador e/ou aplicativo. Perfeito para saber a hora certa de fazer follow-up!",
    icon: Bell,
    visual: (
      <div className="relative p-6 bg-gradient-to-br from-yellow-500/10 to-orange-400/10 rounded-2xl border border-yellow-500/20">
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="bg-card border border-border rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Email Aberto!</div>
              <div className="text-xs text-muted-foreground">
                cliente@empresa.com abriu "Proposta Comercial"
              </div>
              <div className="text-xs text-primary mt-2">Agora mesmo</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground text-xs font-bold"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          1
        </motion.div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Rastreie Cliques em Links",
    description:
      "Saiba exatamente quais links o destinatário clicou, quantas vezes e quando. Identifique o interesse real do cliente!",
    icon: MousePointerClick,
    visual: (
      <div className="relative p-6 bg-gradient-to-br from-purple-500/10 to-violet-400/10 rounded-2xl border border-purple-500/20">
        <div className="space-y-3">
          {[
            { url: "proposta.pdf", clicks: 3, icon: FileText },
            { url: "catalogo.com/produtos", clicks: 7, icon: MousePointerClick },
            { url: "empresa.com/precos", clicks: 2, icon: BarChart3 },
          ].map((link, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4 text-purple-500" />
                <span className="text-sm truncate max-w-[150px]">{link.url}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {link.clicks} cliques
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "Análise Completa no Dashboard",
    description:
      "Visualize todas as métricas em um dashboard intuitivo. Exporte relatórios, configure alertas e integre com seu CRM.",
    icon: BarChart3,
    visual: (
      <div className="relative p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Enviados", value: "127" },
            { label: "Abertos", value: "89" },
            { label: "Clicados", value: "34" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center p-3 bg-card/50 rounded-lg"
            >
              <div className="text-lg font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="flex items-end justify-between h-24 gap-2">
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
              className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm"
            />
          ))}
        </div>
      </div>
    ),
  },
];

export const DemoModal = ({ open, onOpenChange }: DemoModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  const step = demoSteps[currentStep];
  const isLastStep = currentStep === demoSteps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              <Play className="h-3 w-3 mr-1" />
              Demo Interativo
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {currentStep + 1} de {demoSteps.length}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-display flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <step.icon className="h-5 w-5 text-white" />
            </div>
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step.visual}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {demoSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-6 bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
              aria-label={`Ir para passo ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button onClick={handleStart} className="gradient-primary text-white gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Começar Agora
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
