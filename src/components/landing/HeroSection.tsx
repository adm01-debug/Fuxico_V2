import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail, Eye, MousePointerClick, Lock, ArrowRight, Sparkles, Play, Star } from 'lucide-react';
import { fadeInUp, staggerContainer } from './animations';

// Parallax hero mockup
const HeroMockup = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [2, -2]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y, scale }}
      className="relative mx-auto mt-12 max-w-4xl px-4 sm:mt-16"
    >
      <motion.div
        style={{ rotateX: rotate }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="mx-4 flex-1">
            <div className="flex items-center gap-2 rounded-md bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              app.fuxico.com.br/dashboard
            </div>
          </div>
        </div>
        {/* Mock dashboard content */}
        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Emails Enviados',
                val: '1.247',
                icon: Mail,
                color: 'from-sky-500 to-blue-600',
              },
              {
                label: 'Taxa de Abertura',
                val: '78%',
                icon: Eye,
                color: 'from-emerald-500 to-green-600',
              },
              {
                label: 'Cliques',
                val: '342',
                icon: MousePointerClick,
                color: 'from-violet-500 to-purple-600',
              },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className="rounded-xl border border-border/50 bg-card p-3 sm:p-4"
              >
                <div
                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${m.color} mb-2 flex items-center justify-center`}
                >
                  <m.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg font-bold sm:text-xl">{m.val}</div>
                <div className="text-[10px] text-muted-foreground sm:text-xs">{m.label}</div>
              </motion.div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="flex h-32 items-end gap-1 rounded-xl border border-border/30 bg-muted/30 p-4">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/60 to-primary/30"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.2 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          {/* Activity items */}
          <div className="space-y-2">
            {[
              {
                email: 'carlos@techcorp.com',
                action: 'abriu seu email',
                time: 'agora',
                icon: Eye,
                color: 'text-emerald-500',
              },
              {
                email: 'ana@startup.io',
                action: 'clicou no link',
                time: '2min',
                icon: MousePointerClick,
                color: 'text-blue-500',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + i * 0.2 }}
                className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/30 p-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background">
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium">{item.email}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{item.action}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      {/* Glow underneath */}
      <div className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
    </motion.div>
  );
};

interface HeroSectionProps {
  onNavigateAuth: () => void;
  onOpenDemo: () => void;
}

export const HeroSection = ({ onNavigateAuth, onOpenDemo }: HeroSectionProps) => (
  <section className="container relative mx-auto px-4 pb-8 pt-12 sm:px-6 sm:pt-20 md:pt-28">
    <motion.div
      className="mx-auto max-w-5xl text-center"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Badge */}
      <motion.div variants={fadeInUp}>
        <Badge
          variant="secondary"
          className="group mb-6 cursor-pointer border border-primary/20 bg-primary/5 px-4 py-2 text-sm transition-colors hover:bg-primary/10"
        >
          <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
          <span className="gradient-text font-medium">Novo: IA para Otimização de Assuntos</span>
          <ArrowRight className="ml-2 h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-1" />
        </Badge>
      </motion.div>

      {/* Heading */}
      <motion.h1
        variants={fadeInUp}
        className="mb-6 font-display text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-7xl lg:text-8xl"
      >
        Saiba quando seus
        <br />
        <span className="gradient-text-animated">emails são lidos</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={fadeInUp}
        className="mx-auto mb-8 max-w-3xl text-balance px-2 text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-xl md:text-2xl"
      >
        Rastreie aberturas, cliques e visualizações de forma{' '}
        <span className="font-semibold text-foreground">invisível</span> e{' '}
        <span className="font-semibold text-foreground">precisa</span>.{' '}
        <span className="hidden sm:inline">
          <br />
        </span>
        Perfeito para vendas, follow-ups e comunicação empresarial.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0"
      >
        <Button
          size="lg"
          onClick={onNavigateAuth}
          className="gradient-primary hover-lift press-effect group h-12 w-full rounded-xl border-0 px-8 text-base text-white shadow-glow transition-all duration-300 hover:shadow-glow-lg sm:h-14 sm:w-auto sm:px-10 sm:text-lg"
        >
          <Mail className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
          Começar Agora — É Grátis
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onOpenDemo}
          className="hover-lift h-12 w-full gap-2 rounded-xl border-2 px-8 text-base transition-all duration-300 hover:bg-secondary/80 sm:h-14 sm:w-auto sm:px-10 sm:text-lg"
        >
          <Play className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
          Ver Demo
        </Button>
      </motion.div>

      {/* Social proof */}
      <motion.div
        variants={fadeInUp}
        className="mt-8 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground sm:mt-10 sm:flex-row sm:gap-6 sm:text-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {['CS', 'AS', 'PO', 'MR', 'JL'].map((initials, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-white"
              >
                {initials}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>
        <span>
          Amado por <span className="font-semibold text-foreground">1.000+</span> profissionais
        </span>
      </motion.div>
    </motion.div>

    {/* Hero Mockup with Parallax */}
    <HeroMockup />
  </section>
);
