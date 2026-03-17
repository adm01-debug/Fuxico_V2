import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  FileText, 
  Building2, 
  Shield, 
  Bell,
  Chrome,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  Clock,
  Globe,
  Sparkles,
  Play,
  Star,
  Lock,
  ExternalLink,
  EyeOff,
  TrendingUp,
  Send,
  Target,
} from "lucide-react";
import logoImg from "@/assets/logo.webp";
import { ThemeToggleButton } from "@/components/landing/ThemeToggleButton";
import { DemoModal } from "@/components/landing/DemoModal";
import { TrustBar, SecurityBadges } from "@/components/landing/TrustSignals";

// Animation variants
const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOutExpo } }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOutExpo } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOutExpo } }
};

const features = [
  {
    icon: Eye,
    title: "Rastreamento de Aberturas",
    description: "Saiba exatamente quando seu email foi aberto com precisão de segundos",
    gradient: "from-sky-500 to-blue-600",
    bgGlow: "bg-sky-500/10",
  },
  {
    icon: MousePointerClick,
    title: "Cliques em Links",
    description: "Monitore quais links foram clicados e quantas vezes",
    gradient: "from-emerald-500 to-green-600",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Documentos Rastreados",
    description: "Envie PDFs e documentos com rastreamento de visualização por página",
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: Building2,
    title: "Integração Bitrix24",
    description: "Sincronize automaticamente com seu CRM favorito",
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Auditoria Empresarial",
    description: "Controle total sobre emails enviados e recebidos pela equipe",
    gradient: "from-rose-500 to-red-600",
    bgGlow: "bg-rose-500/10",
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description: "Receba alertas instantâneos quando seus emails são lidos",
    gradient: "from-yellow-500 to-orange-500",
    bgGlow: "bg-yellow-500/10",
  }
];

const stats = [
  { value: "99.9", suffix: "%", label: "Precisão de Rastreamento", icon: Target },
  { value: "<1", suffix: "s", label: "Tempo de Notificação", icon: Zap },
  { value: "100", suffix: "%", label: "Compatível com Gmail", icon: Mail },
  { value: "24", suffix: "/7", label: "Monitoramento Ativo", icon: Clock }
];

const steps = [
  { number: "1", title: "Instale a Extensão", description: "Adicione o FUXICO ao seu Chrome em segundos", icon: Chrome },
  { number: "2", title: "Faça Login", description: "Use sua conta para sincronizar seus dados", icon: Users },
  { number: "3", title: "Envie Emails", description: "O rastreamento é automático e invisível", icon: Mail },
  { number: "4", title: "Acompanhe", description: "Veja quem abriu seus emails em tempo real", icon: Eye }
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Diretor Comercial",
    company: "TechCorp",
    content: "O FUXICO revolucionou nossa estratégia de follow-up. Agora sabemos exatamente quando ligar.",
    avatar: "CS",
    rating: 5,
  },
  {
    name: "Ana Santos",
    role: "Gerente de Vendas",
    company: "StartupX",
    content: "Aumentamos nossa taxa de conversão em 40% usando os insights do FUXICO.",
    avatar: "AS",
    rating: 5,
  },
  {
    name: "Pedro Oliveira",
    role: "CEO",
    company: "AgênciaDigital",
    content: "Ferramenta essencial para qualquer profissional que trabalha com emails.",
    avatar: "PO",
    rating: 5,
  }
];

// Animated counter
const AnimatedCounter = ({ value, suffix }: { value: string; suffix: string }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value.replace('<', ''));
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const mountDelay = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(mountDelay);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const duration = 2000;
    const totalSteps = 60;
    const increment = numericValue / totalSteps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / totalSteps);
    return () => clearInterval(timer);
  }, [mounted, numericValue]);
  
  return (
    <span className="font-mono tabular-nums">
      {value.includes('<') ? '<' : ''}{numericValue % 1 !== 0 ? count.toFixed(1) : Math.round(count)}{suffix}
    </span>
  );
};

// Orb background effect
const OrbBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
        top: '-10%',
        right: '-10%',
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)',
        bottom: '-5%',
        left: '-10%',
      }}
      animate={{ scale: [1.2, 1, 1.2], rotate: [0, -30, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute w-[400px] h-[400px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--success) / 0.08) 0%, transparent 70%)',
        top: '40%',
        left: '30%',
      }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

// Before/After comparison
const BeforeAfterSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const beforeItems = [
    { icon: EyeOff, text: "Enviar email e torcer para ser lido", color: "text-muted-foreground" },
    { icon: Clock, text: "Esperar dias sem saber o status", color: "text-muted-foreground" },
    { icon: Send, text: "Follow-up no escuro, sem timing", color: "text-muted-foreground" },
  ];

  const afterItems = [
    { icon: Eye, text: "Saber em segundos quando foi aberto", color: "text-primary" },
    { icon: Zap, text: "Notificação instantânea de leitura", color: "text-primary" },
    { icon: TrendingUp, text: "Follow-up no momento exato", color: "text-primary" },
  ];

  return (
    <section ref={ref} className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
      <motion.div
        className="text-center mb-12 sm:mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
          <Sparkles className="h-3 w-3 mr-1 text-primary" />
          Transformação
        </Badge>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
          Antes vs. <span className="gradient-text">Depois</span> do FUXICO
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
          Veja como o FUXICO transforma sua comunicação por email
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* Before */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={slideInLeft}
        >
          <Card className="relative overflow-hidden border-2 border-destructive/20 bg-card/60 backdrop-blur-sm h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <EyeOff className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-destructive">Sem FUXICO</h3>
                  <p className="text-xs text-muted-foreground">O dia-a-dia de quem envia emails no escuro</p>
                </div>
              </div>
              <div className="space-y-4">
                {beforeItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <item.icon className="h-5 w-5 text-destructive/60 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-destructive/10">
                <div className="flex items-center gap-2 text-destructive/70">
                  <TrendingUp className="h-4 w-4 rotate-180" />
                  <span className="text-sm font-medium">Taxa de conversão baixa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* After */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={slideInRight}
        >
          <Card className="relative overflow-hidden border-2 border-primary/30 bg-card/60 backdrop-blur-sm h-full shadow-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/3 to-transparent" />
            {/* Shimmer */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display gradient-text">Com FUXICO</h3>
                  <p className="text-xs text-muted-foreground">Controle total sobre suas comunicações</p>
                </div>
              </div>
              <div className="space-y-4">
                {afterItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15"
                  >
                    <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-primary/15">
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+300% na taxa de conversão</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const [demoOpen, setDemoOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);
  
  if (user) return null;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Orb backgrounds */}
      <OrbBackground />

      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 gradient-primary z-[60] origin-left"
        style={{ scaleX: scrollYProgress }}
      />
      
      {/* Header */}
      <motion.header 
        className="border-b border-border/40 bg-background/70 backdrop-blur-2xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative group">
                <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg relative z-10" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight">FUXICO</h1>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Email Tracking Pro</p>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 sm:gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ThemeToggleButton />
              <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium h-10 px-3 sm:px-4 text-sm sm:text-base">
                Entrar
              </Button>
              <Button 
                onClick={() => navigate("/auth")} 
                className="gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 press-effect h-10 px-3 sm:px-5 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Começar Grátis</span>
                <span className="sm:hidden">Iniciar</span>
                <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
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
            <span className="text-foreground font-semibold">precisa</span>.
            <br className="hidden sm:block" />
            Perfeito para vendas, follow-ups e comunicação empresarial.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
          >
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover-lift press-effect group rounded-xl"
            >
              <Mail className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Começar Agora — É Grátis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 border-2 hover:bg-secondary/80 transition-all duration-300 hover-lift rounded-xl"
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

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              variants={scaleIn}
              whileHover={{ y: -4, scale: 1.02 }}
              className="text-center p-5 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="inline-flex p-2 rounded-xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl sm:text-4xl font-bold gradient-text font-display">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust Bar */}
      <TrustBar />

      {/* Features Section - Bento Grid */}
      <section id="features-section" className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
        <motion.div 
          className="text-center mb-12 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">Funcionalidades</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
            Tudo que você precisa para{" "}
            <span className="gradient-text">vender mais</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
            Funcionalidades poderosas para controle total sobre sua comunicação
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="group border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden h-full bg-card/60 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6 sm:p-8 relative">
                  {/* Hover glow */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${feature.bgGlow} opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500`} />
                  
                  {/* Icon */}
                  <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  
                  <h3 className="relative text-lg sm:text-xl font-semibold font-display mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Before/After Section */}
      <BeforeAfterSection />

      {/* How it Works */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
        
        <motion.div 
          className="text-center mb-12 sm:mb-16 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">Como Funciona</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
            4 passos <span className="gradient-text">simples</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg">
            Comece a rastrear seus emails em minutos
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 rounded-full" />
          </div>
          
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={scaleIn}
              className="text-center relative z-10"
            >
              <motion.div 
                className="relative inline-block mb-5"
                whileHover={{ y: -4, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-glow">
                  {step.number}
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-card border-2 border-border shadow-md flex items-center justify-center">
                  <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
              </motion.div>
              <h3 className="font-semibold font-display text-sm sm:text-lg mb-1">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div 
          className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={slideInLeft}>
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">Benefícios</Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-8 tracking-tight">
              Por que escolher o <span className="gradient-text">FUXICO</span>?
            </h2>
            <div className="space-y-4">
              {[
                { title: "100% Invisível", desc: "O destinatário nunca sabe que está sendo rastreado" },
                { title: "Detecção de Self-Opens", desc: "Ignora automaticamente quando você mesmo abre o email" },
                { title: "Integração com CRM", desc: "Sincronize atividades automaticamente com Bitrix24" },
                { title: "Auditoria Completa", desc: "Controle total sobre emails da sua equipe" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 group cursor-default"
                  whileHover={{ x: 6 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg gradient-success flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold font-display text-base sm:text-lg group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            variants={slideInRight}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: BarChart3, value: "+300%", label: "Taxa de Follow-up", gradient: "from-sky-500 to-blue-600" },
              { icon: Users, value: "1.000+", label: "Usuários Ativos", gradient: "from-violet-500 to-purple-600" },
              { icon: Clock, value: "2h", label: "Economia/Dia", gradient: "from-emerald-500 to-green-600" },
              { icon: Globe, value: "Global", label: "Rastreamento", gradient: "from-amber-500 to-orange-600" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-5 sm:p-6 text-center bg-card/60 backdrop-blur-sm border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3 shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-display gradient-text">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
        
        <motion.div 
          className="text-center mb-12 sm:mb-16 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">Depoimentos</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-4 tracking-tight">
            O que dizem nossos <span className="gradient-text">usuários</span>
          </h2>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-6 h-full bg-card/60 backdrop-blur-sm border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white shadow-md group-hover:shadow-lg transition-shadow">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.company}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div 
          className="relative rounded-3xl overflow-hidden max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleIn}
        >
          {/* Background */}
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0tMi0yaC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
          {/* Animated orbs */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          
          <div className="relative p-10 sm:p-14 md:p-20 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 shadow-xl"
            >
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-4 tracking-tight">
              Pronto para saber quem lê seus emails?
            </h2>
            <p className="text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto text-sm sm:text-lg">
              Comece gratuitamente agora mesmo. Sem cartão de crédito, sem compromisso.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate("/auth")}
              className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover-lift press-effect rounded-xl"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Security Badges */}
      <SecurityBadges />

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 sm:py-14 relative bg-card/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
                <div>
                  <span className="font-bold font-display text-lg">FUXICO</span>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Email Tracking Profissional</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                A solução mais completa para rastreamento de emails empresariais. 
                Saiba exatamente quando seus emails são lidos e aumente suas conversões.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Preços</button>
                </li>
                <li>
                  <button onClick={() => setDemoOpen(true)} className="hover:text-primary transition-colors">Ver Demo</button>
                </li>
                <li>
                  <a href="#features-section" className="hover:text-primary transition-colors">Funcionalidades</a>
                </li>
                <li>
                  <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                    Extensão Chrome <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LGPD</a></li>
                <li><a href="mailto:contato@fuxico.app" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Dados protegidos com criptografia de ponta-a-ponta</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} FUXICO by Promo Brindes. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default Index;
