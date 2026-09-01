import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Mail, Eye, MousePointerClick, Lock, ArrowRight, Sparkles, Play, Star,
} from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

// Parallax hero mockup
const HeroMockup = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rotate = useTransform(scrollYProgress, [0, 1], [2, -2]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1]);

  return (
    <motion.div ref={ref} style={{ y, scale }} className="relative mt-12 sm:mt-16 max-w-4xl mx-auto px-4">
      <motion.div
        style={{ rotateX: rotate }}
        className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background/60 rounded-md px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-3 w-3" />
              app.fuxico.com.br/dashboard
            </div>
          </div>
        </div>
        {/* Mock dashboard content */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Emails Enviados", val: "1.247", icon: Mail, color: "from-sky-500 to-blue-600" },
              { label: "Taxa de Abertura", val: "78%", icon: Eye, color: "from-emerald-500 to-green-600" },
              { label: "Cliques", val: "342", icon: MousePointerClick, color: "from-violet-500 to-purple-600" },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
                className="rounded-xl bg-card border border-border/50 p-3 sm:p-4"
              >
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-2`}>
                  <m.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold">{m.val}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{m.label}</div>
              </motion.div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="rounded-xl bg-muted/30 border border-border/30 p-4 h-32 flex items-end gap-1">
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
              { email: "carlos@techcorp.com", action: "abriu seu email", time: "agora", icon: Eye, color: "text-emerald-500" },
              { email: "ana@startup.io", action: "clicou no link", time: "2min", icon: MousePointerClick, color: "text-blue-500" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + i * 0.2 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="h-7 w-7 rounded-full bg-background flex items-center justify-center">
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{item.email}</span>
                  <span className="text-xs text-muted-foreground ml-1">{item.action}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      {/* Glow underneath */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/20 blur-3xl rounded-full" />
    </motion.div>
  );
};

interface HeroSectionProps {
  onNavigateAuth: () => void;
  onOpenDemo: () => void;
}

export const HeroSection = ({ onNavigateAuth, onOpenDemo }: HeroSectionProps) => (
  <section className="container mx-auto px-4 sm:px-6 pt-12 sm:pt-20 md:pt-28 pb-8 relative">
    <motion.div
      className="text-center max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Badge */}
      <motion.div variants={fadeInUp}>
        <Badge
          variant="secondary"
          className="mb-6 px-4 py-2 text-sm border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
        >
          <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
          <span className="gradient-text font-medium">Novo: IA para Otimização de Assuntos</span>
          <ArrowRight className="h-3.5 w-3.5 ml-2 text-primary group-hover:translate-x-1 transition-transform" />
        </Badge>
      </motion.div>

      {/* Heading */}
      <motion.h1
        variants={fadeInUp}
        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-display mb-6 leading-[1.05] tracking-tighter"
      >
        Saiba quando seus
        <br />
        <span className="gradient-text-animated">emails são lidos</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={fadeInUp}
        className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed text-balance px-2"
      >
        Rastreie aberturas, cliques e visualizações de forma{" "}
        <span className="text-foreground font-semibold">invisível</span> e{" "}
        <span className="text-foreground font-semibold">precisa</span>.{" "}
        <span className="hidden sm:inline"><br /></span>
        Perfeito para vendas, follow-ups e comunicação empresarial.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
      >
        <Button
          size="lg"
          onClick={onNavigateAuth}
          className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover-lift press-effect group rounded-xl"
        >
          <Mail className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
          Começar Agora — É Grátis
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onOpenDemo}
          className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 border-2 hover:bg-secondary/80 transition-all duration-300 hover-lift rounded-xl"
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
          Ver Demo
        </Button>
      </motion.div>

      {/* Social proof */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-8 sm:mt-10 text-xs sm:text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {['CS', 'AS', 'PO', 'MR', 'JL'].map((initials, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white border-2 border-background"
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
        <span>Amado por <span className="text-foreground font-semibold">1.000+</span> profissionais</span>
      </motion.div>
    </motion.div>

    {/* Hero Mockup with Parallax */}
    <HeroMockup />
  </section>
);
