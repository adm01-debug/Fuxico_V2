import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Building2,
  ArrowLeft,
  Shield,
  Clock,
  Users,
  Mail,
  Star,
} from "lucide-react";
import logoImg from "@/assets/logo.jpg";
import { ThemeToggleButton } from "@/components/landing/ThemeToggleButton";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const plans = [
  {
    id: "free",
    name: "Grátis",
    description: "Perfeito para começar a rastrear seus emails",
    price: "R$ 0",
    period: "para sempre",
    cta: "Começar Grátis",
    popular: false,
    icon: Zap,
    gradient: "from-slate-500 to-gray-400",
    features: [
      { text: "50 emails rastreados/mês", included: true },
      { text: "Notificações em tempo real", included: true },
      { text: "Extensão Chrome", included: true },
      { text: "Dashboard básico", included: true },
      { text: "Rastreamento de aberturas", included: true },
      { text: "Rastreamento de cliques", included: false },
      { text: "Documentos rastreados", included: false },
      { text: "Integração Bitrix24", included: false },
      { text: "API access", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    id: "pro",
    name: "Profissional",
    description: "Para profissionais que precisam de mais recursos",
    price: "R$ 49",
    period: "/mês",
    cta: "Começar Trial Grátis",
    popular: true,
    icon: Sparkles,
    gradient: "from-primary to-accent",
    features: [
      { text: "Emails ilimitados", included: true },
      { text: "Notificações em tempo real", included: true },
      { text: "Extensão Chrome", included: true },
      { text: "Dashboard avançado", included: true },
      { text: "Rastreamento de aberturas", included: true },
      { text: "Rastreamento de cliques", included: true },
      { text: "10 documentos/mês", included: true },
      { text: "Integração Bitrix24", included: true },
      { text: "API access", included: false },
      { text: "Suporte prioritário", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Empresarial",
    description: "Para equipes que precisam de controle total",
    price: "R$ 199",
    period: "/mês",
    cta: "Falar com Vendas",
    popular: false,
    icon: Building2,
    gradient: "from-purple-500 to-violet-400",
    features: [
      { text: "Emails ilimitados", included: true },
      { text: "Notificações em tempo real", included: true },
      { text: "Extensão Chrome", included: true },
      { text: "Dashboard empresarial", included: true },
      { text: "Rastreamento de aberturas", included: true },
      { text: "Rastreamento de cliques", included: true },
      { text: "Documentos ilimitados", included: true },
      { text: "Integração Bitrix24", included: true },
      { text: "API access", included: true },
      { text: "Suporte prioritário 24/7", included: true },
    ],
  },
];

const trustSignals = [
  { icon: Shield, text: "Dados criptografados", description: "SSL/TLS 256-bit" },
  { icon: Clock, text: "99.9% Uptime", description: "SLA garantido" },
  { icon: Users, text: "1.000+ clientes", description: "Satisfação total" },
  { icon: Mail, text: "LGPD Compliant", description: "Seus dados seguros" },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
                <div>
                  <h1 className="text-2xl font-bold font-display tracking-tight">FUXICO</h1>
                  <p className="text-xs text-muted-foreground tracking-wide">Planos e Preços</p>
                </div>
              </div>
            </div>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Preços Simples e Transparentes
            </Badge>
          </motion.div>
          
          <motion.h1
            variants={fadeInUp}
            className="text-3xl sm:text-5xl md:text-6xl font-bold font-display mb-4 tracking-tight"
          >
            Escolha o plano ideal para{" "}
            <span className="gradient-text">seu negócio</span>
          </motion.h1>
          
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-muted-foreground mb-8"
          >
            Comece gratuitamente e faça upgrade quando precisar de mais recursos.
            Sem surpresas, sem taxas escondidas.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={fadeInUp}>
              <Card
                className={`relative h-full transition-all duration-300 hover-lift ${
                  plan.popular
                    ? "border-primary shadow-glow"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="gradient-primary text-white border-0 shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex mx-auto p-3 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold font-display">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    onClick={() => navigate("/auth")}
                    className={`w-full ${
                      plan.popular
                        ? "gradient-primary text-white border-0"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>

                  <div className="pt-4 space-y-3">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 text-sm ${
                          feature.included ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span className={!feature.included ? "line-through" : ""}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust Signals */}
      <section className="container mx-auto px-4 sm:px-6 py-12 border-t border-border/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {trustSignals.map((signal, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="text-center p-4"
            >
              <div className="inline-flex p-3 rounded-xl bg-muted/50 mb-3">
                <signal.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold text-sm">{signal.text}</div>
              <div className="text-xs text-muted-foreground">{signal.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ Preview */}
      <section className="container mx-auto px-4 sm:px-6 py-12 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl font-bold font-display mb-4">Ainda tem dúvidas?</h2>
          <p className="text-muted-foreground mb-6">
            Entre em contato conosco. Estamos aqui para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Falar com Suporte
            </Button>
            <Button onClick={() => navigate("/auth")} className="gradient-primary text-white border-0">
              Começar Grátis
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2025 FUXICO. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
