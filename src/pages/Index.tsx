import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  FileText, 
  Link2, 
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
  Star
} from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { ThemeToggleButton } from "@/components/landing/ThemeToggleButton";
import { DemoModal } from "@/components/landing/DemoModal";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

const features = [
  {
    icon: Eye,
    title: "Rastreamento de Aberturas",
    description: "Saiba exatamente quando seu email foi aberto com precisão de segundos",
    gradient: "from-blue-500 to-cyan-400"
  },
  {
    icon: MousePointerClick,
    title: "Cliques em Links",
    description: "Monitore quais links foram clicados e quantas vezes",
    gradient: "from-green-500 to-emerald-400"
  },
  {
    icon: FileText,
    title: "Documentos Rastreados",
    description: "Envie PDFs e documentos com rastreamento de visualização",
    gradient: "from-purple-500 to-violet-400"
  },
  {
    icon: Building2,
    title: "Integração Bitrix24",
    description: "Sincronize automaticamente com seu CRM favorito",
    gradient: "from-orange-500 to-amber-400"
  },
  {
    icon: Shield,
    title: "Auditoria Empresarial",
    description: "Controle total sobre emails enviados e recebidos pela equipe",
    gradient: "from-red-500 to-rose-400"
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description: "Receba alertas instantâneos quando seus emails são lidos",
    gradient: "from-yellow-500 to-orange-400"
  }
];

const stats = [
  { value: "99.9", suffix: "%", label: "Precisão de Rastreamento" },
  { value: "<1", suffix: "s", label: "Tempo de Notificação" },
  { value: "100", suffix: "%", label: "Compatível com Gmail" },
  { value: "24", suffix: "/7", label: "Monitoramento Ativo" }
];

const steps = [
  {
    number: "1",
    title: "Instale a Extensão",
    description: "Adicione o FUXICO ao seu Chrome em segundos",
    icon: Chrome
  },
  {
    number: "2",
    title: "Faça Login",
    description: "Use sua conta para sincronizar seus dados",
    icon: Users
  },
  {
    number: "3",
    title: "Envie Emails",
    description: "O rastreamento é automático e invisível",
    icon: Mail
  },
  {
    number: "4",
    title: "Acompanhe",
    description: "Veja quem abriu seus emails em tempo real",
    icon: Eye
  }
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Diretor Comercial",
    company: "TechCorp",
    content: "O FUXICO revolucionou nossa estratégia de follow-up. Agora sabemos exatamente quando ligar.",
    avatar: "CS"
  },
  {
    name: "Ana Santos",
    role: "Gerente de Vendas",
    company: "StartupX",
    content: "Aumentamos nossa taxa de conversão em 40% usando os insights do FUXICO.",
    avatar: "AS"
  },
  {
    name: "Pedro Oliveira",
    role: "CEO",
    company: "AgênciaDigital",
    content: "Ferramenta essencial para qualquer profissional que trabalha com emails.",
    avatar: "PO"
  }
];

// Animated counter component
const AnimatedCounter = ({ value, suffix }: { value: string; suffix: string }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value.replace('<', ''));
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [numericValue]);
  
  return (
    <span className="font-mono">
      {value.includes('<') ? '<' : ''}{Math.round(count)}{suffix}
    </span>
  );
};

// Floating particles background
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-primary/20 rounded-full"
        initial={{
          x: Math.random() * 100 + "%",
          y: Math.random() * 100 + "%",
          scale: Math.random() * 0.5 + 0.5
        }}
        animate={{
          y: [null, "-20%", "120%"],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          delay: Math.random() * 5
        }}
      />
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);
  const [demoOpen, setDemoOpen] = useState(false);
  
  // Se já está logado, redireciona para o dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);
  
  // Retorna null enquanto redireciona
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 gradient-mesh opacity-50 pointer-events-none" />
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Header */}
      <motion.header 
        style={{ opacity: headerOpacity }}
        className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-30" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight">FUXICO</h1>
                <p className="text-xs text-muted-foreground tracking-wide">Email Tracking Pro</p>
              </div>
            </motion.div>
          <motion.div 
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ThemeToggleButton />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="font-medium h-10 px-3 sm:px-4 text-sm sm:text-base touch-target">
              Entrar
            </Button>
            <Button 
              onClick={() => navigate("/auth")} 
              className="gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 press-effect h-10 px-3 sm:px-4 text-sm sm:text-base touch-target"
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
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-32 relative">
        <motion.div 
          className="text-center max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Animated badge */}
          <motion.div variants={fadeInUp}>
            <Badge 
              variant="secondary" 
              className="mb-6 px-4 py-2 text-sm border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 text-primary group-hover:animate-wiggle" />
              <span className="gradient-text font-medium">Novo: Integração com Bitrix24</span>
              <ArrowRight className="h-3.5 w-3.5 ml-2 text-primary group-hover:translate-x-1 transition-transform" />
            </Badge>
          </motion.div>
          
          {/* Main heading with gradient */}
          <motion.h1 
            variants={fadeInUp}
            className="text-3xl sm:text-5xl md:text-7xl font-bold font-display mb-4 sm:mb-6 leading-[1.1] tracking-tighter"
          >
            Saiba quando seus
            <br />
            <span className="gradient-text-animated">emails são lidos</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-10 max-w-3xl mx-auto leading-relaxed text-balance px-2"
          >
            O FUXICO rastreia aberturas, cliques e visualizações dos seus emails de forma 
            <span className="text-foreground font-medium"> invisível </span> 
            e 
            <span className="text-foreground font-medium"> precisa</span>. 
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
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover-lift press-effect group touch-target"
            >
              <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-wiggle" />
              <span className="hidden xs:inline">Começar Agora - É Grátis</span>
              <span className="xs:hidden">Começar Grátis</span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setDemoOpen(true)}
              className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg gap-2 border-2 hover:bg-secondary/80 transition-all duration-300 hover-lift touch-target"
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
              <div className="flex -space-x-2">
                {['CS', 'AS', 'PO', 'MR', 'JL'].map((initials, i) => (
                  <div 
                    key={i}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] sm:text-xs font-bold text-white border-2 border-background"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <span className="text-center">Amado por <span className="text-foreground font-semibold">1.000+</span> profissionais</span>
          </motion.div>
        </motion.div>

        {/* Animated Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-12 sm:mt-20 max-w-4xl mx-auto px-2 sm:px-0"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              variants={scaleIn}
              className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover-lift cursor-default"
            >
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold gradient-text font-display">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 relative">
        <motion.div 
          className="text-center mb-10 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-3 sm:mb-4">Funcionalidades</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-3 sm:mb-4 tracking-tight">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg px-4">
            Funcionalidades poderosas para você e sua equipe terem controle total sobre a comunicação
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="group border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover-lift overflow-hidden h-full bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5 sm:p-8 relative">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Icon with gradient background */}
                  <div className={`inline-flex p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.gradient} mb-3 sm:mb-4 shadow-lg`}>
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold font-display mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        
        <motion.div 
          className="text-center mb-10 sm:mb-16 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-3 sm:mb-4">Como Funciona</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-3 sm:mb-4 tracking-tight">
            4 passos simples
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-lg px-4">
            Comece a rastrear seus emails em minutos
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-5xl mx-auto relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 z-0" />
          
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={scaleIn}
              className="text-center relative z-10"
            >
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-glow">
                  {step.number}
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-card border-2 border-border flex items-center justify-center">
                  <step.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold font-display text-sm sm:text-lg mb-1 sm:mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div 
          className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="outline" className="mb-3 sm:mb-4">Benefícios</Badge>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-6 sm:mb-8 tracking-tight">
              Por que escolher o <span className="gradient-text">FUXICO</span>?
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {[
                { title: "100% Invisível", desc: "O destinatário nunca sabe que está sendo rastreado" },
                { title: "Detecção de Self-Opens", desc: "Ignora automaticamente quando você mesmo abre o email" },
                { title: "Integração com CRM", desc: "Sincronize atividades automaticamente com Bitrix24" },
                { title: "Auditoria Completa", desc: "Controle total sobre emails da sua equipe" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-success flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold font-display text-base sm:text-lg">{item.title}</h4>
                    <p className="text-sm sm:text-base text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {[
              { icon: BarChart3, value: "+300%", label: "Taxa de Follow-up", gradient: "from-blue-500 to-cyan-400" },
              { icon: Users, value: "1.000+", label: "Usuários Ativos", gradient: "from-purple-500 to-violet-400" },
              { icon: Clock, value: "2h", label: "Economia/Dia", gradient: "from-green-500 to-emerald-400" },
              { icon: Globe, value: "Global", label: "Rastreamento", gradient: "from-orange-500 to-amber-400" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-4 sm:p-6 text-center bg-card/50 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300">
                  <div className={`inline-flex p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} mb-2 sm:mb-3`}>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-xl sm:text-3xl font-bold font-display gradient-text">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div 
          className="text-center mb-10 sm:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Badge variant="outline" className="mb-3 sm:mb-4">Depoimentos</Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display mb-3 sm:mb-4 tracking-tight">
            O que dizem nossos usuários
          </h2>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="p-5 sm:p-6 h-full bg-card/50 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300 hover-lift">
                <div className="flex items-center gap-0.5 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center text-xs sm:text-sm font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{testimonial.role} • {testimonial.company}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div 
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleIn}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0tMi0yaC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative p-8 sm:p-12 md:p-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm mb-4 sm:mb-6"
            >
              <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-3 sm:mb-4 tracking-tight">
              Pronto para saber quem lê seus emails?
            </h2>
            <p className="text-white/80 mb-6 sm:mb-10 max-w-2xl mx-auto text-sm sm:text-lg px-2">
              Comece gratuitamente agora mesmo. Sem cartão de crédito, sem compromisso.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate("/auth")}
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift press-effect touch-target"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 sm:py-12 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="FUXICO" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl object-cover" />
              <div>
                <span className="font-bold font-display text-base sm:text-lg">FUXICO</span>
                <span className="text-muted-foreground text-xs sm:text-sm ml-2">by Promo Brindes</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors touch-target py-2">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors touch-target py-2">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors touch-target py-2">Contato</a>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              © 2025 FUXICO. Todos os direitos reservados.
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
