import React from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Mail, Eye, MousePointerClick, Bell, Chrome, Zap,
  Check, Sparkles, Rocket, Star, Shield, BarChart3, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PulseRing, CelebrationBurst } from '@/components/ui/confetti';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  delay: number;
}

export const FeatureCard = ({ icon: Icon, title, description, color, delay }: FeatureCardProps) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default", `bg-gradient-to-br ${color}`)}>
    <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm"><Icon className="h-5 w-5" /></div>
    <span className="text-sm font-medium text-center">{title}</span>
    <span className="text-xs text-muted-foreground text-center">{description}</span>
  </motion.div>
);

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  color: string;
}

interface Preferences {
  notifyOnOpen: boolean;
  notifyOnClick: boolean;
  desktopNotifications: boolean;
  emailDigest: boolean;
  installExtension: boolean;
}

export function createWizardSteps(
  preferences: Preferences,
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>
): WizardStep[] {
  return [
    {
      id: 'welcome',
      title: 'Bem-vindo ao FUXICO! 🎉',
      description: 'O sistema mais completo de rastreamento de emails',
      icon: <Sparkles className="h-8 w-8" />,
      color: 'from-primary/20 to-primary/5',
      content: (
        <div className="space-y-6 text-center">
          <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
            <div className="relative">
              <PulseRing show={true} color="primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                  <Mail className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-xl font-semibold">Saiba exatamente quando seus emails são lidos</h3>
            <p className="text-muted-foreground">O FUXICO usa tecnologia de pixel invisível para rastrear aberturas e cliques sem que o destinatário perceba.</p>
          </motion.div>
          <div className="grid grid-cols-3 gap-3 pt-4">
            <FeatureCard icon={Eye} title="Aberturas" description="Saiba quando leem" color="from-blue-500/10 to-blue-500/5" delay={0.5} />
            <FeatureCard icon={MousePointerClick} title="Cliques" description="Monitore links" color="from-green-500/10 to-green-500/5" delay={0.6} />
            <FeatureCard icon={Bell} title="Alertas" description="Em tempo real" color="from-purple-500/10 to-purple-500/5" delay={0.7} />
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
            { step: 1, title: 'Crie um rastreamento', description: 'Gere um pixel único para cada email', icon: <Mail className="h-5 w-5" />, color: 'from-blue-500 to-blue-600' },
            { step: 2, title: 'Adicione ao seu email', description: 'Insira o pixel ou use nossa extensão', icon: <Chrome className="h-5 w-5" />, color: 'from-green-500 to-green-600' },
            { step: 3, title: 'Receba notificações', description: 'Alertas em tempo real quando abrem', icon: <Bell className="h-5 w-5" />, color: 'from-purple-500 to-purple-600' },
          ].map((item, index) => (
            <motion.div key={item.step} className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.1 }} whileHover={{ x: 5 }}>
              <motion.div className={cn("flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold shadow-lg", item.color)}
                whileHover={{ scale: 1.1, rotate: 5 }}>{item.step}</motion.div>
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
            { id: 'notifyOnOpen', label: 'Notificar quando email for aberto', description: 'Receba um alerta a cada abertura', icon: Eye, checked: preferences.notifyOnOpen },
            { id: 'notifyOnClick', label: 'Notificar quando link for clicado', description: 'Saiba quando clicam nos seus links', icon: MousePointerClick, checked: preferences.notifyOnClick },
            { id: 'desktopNotifications', label: 'Notificações no desktop', description: 'Receba notificações mesmo fora do app', icon: Bell, checked: preferences.desktopNotifications },
            { id: 'emailDigest', label: 'Resumo diário por email', description: 'Receba um resumo das atividades', icon: Mail, checked: preferences.emailDigest },
          ].map((pref, index) => (
            <motion.div key={pref.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}
              className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                pref.checked ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border/50 hover:border-primary/20")}
              onClick={() => setPreferences(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof prev] }))}>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors", pref.checked ? "bg-primary/10" : "bg-muted")}>
                <pref.icon className={cn("h-5 w-5", pref.checked ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1">
                <Label htmlFor={pref.id} className="font-medium cursor-pointer">{pref.label}</Label>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Checkbox id={pref.id} checked={pref.checked}
                onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, [pref.id]: checked }))} className="h-5 w-5" />
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
          <motion.div className="flex justify-center" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-3xl blur-2xl" />
              <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-2xl">
                <Chrome className="h-12 w-12 text-white" />
              </div>
            </div>
          </motion.div>
          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className="text-lg font-semibold">Automatize seu rastreamento</h3>
            <p className="text-muted-foreground text-sm">Nossa extensão injeta automaticamente o pixel de rastreamento em todos os emails que você envia pelo Gmail.</p>
          </motion.div>
          <motion.div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-xl border border-green-500/20"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Check className="h-5 w-5" /><span className="font-medium">100% automático e invisível</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer",
              preferences.installExtension ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border/50 hover:border-primary/20")}
            onClick={() => setPreferences((prev) => ({ ...prev, installExtension: !prev.installExtension }))}>
            <Checkbox id="installExtension" checked={preferences.installExtension}
              onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, installExtension: !!checked }))} className="h-5 w-5" />
            <Label htmlFor="installExtension" className="flex-1 text-left cursor-pointer">
              <span className="font-medium">Quero instalar a extensão depois</span>
              <p className="text-xs text-muted-foreground mt-0.5">Vamos te lembrar quando terminar o tour</p>
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
          <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
            <div className="relative">
              <CelebrationBurst trigger={true} />
              <motion.div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl"
                animate={{ boxShadow: ["0 0 0 0 rgba(var(--primary), 0.4)", "0 0 0 20px rgba(var(--primary), 0)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}>
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}>
                  <Trophy className="h-14 w-14 text-white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Configuração concluída!</h3>
            <p className="text-muted-foreground text-sm">Suas preferências foram salvas. Agora você pode começar a rastrear seus emails e ter total controle sobre suas comunicações.</p>
          </motion.div>
          <motion.div className="grid grid-cols-2 gap-3 pt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            {[
              { icon: Mail, label: 'Emails ilimitados', value: '∞', color: 'from-blue-500/10 to-blue-500/5' },
              { icon: Zap, label: 'Tempo real', value: '⚡', color: 'from-yellow-500/10 to-yellow-500/5' },
              { icon: Shield, label: 'Dados seguros', value: '🔒', color: 'from-green-500/10 to-green-500/5' },
              { icon: BarChart3, label: 'Analytics', value: '📊', color: 'from-purple-500/10 to-purple-500/5' },
            ].map((item, index) => (
              <motion.div key={item.label} className={cn("p-3 rounded-xl bg-gradient-to-br", item.color)}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }} whileHover={{ scale: 1.05 }}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">+50 XP - Primeira Configuração</span>
          </motion.div>
        </div>
      ),
    },
  ];
}
