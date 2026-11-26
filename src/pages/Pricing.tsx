import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import logoImg from '@/assets/logo.webp';
import { ThemeToggleButton } from '@/components/landing/ThemeToggleButton';

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
    id: 'free',
    name: 'Grátis',
    description: 'Perfeito para começar a rastrear seus emails',
    price: 'R$ 0',
    period: 'para sempre',
    cta: 'Começar Grátis',
    popular: false,
    icon: Zap,
    gradient: 'from-slate-500 to-gray-400',
    features: [
      { text: '50 emails rastreados/mês', included: true },
      { text: 'Notificações em tempo real', included: true },
      { text: 'Extensão Chrome', included: true },
      { text: 'Dashboard básico', included: true },
      { text: 'Rastreamento de aberturas', included: true },
      { text: 'Rastreamento de cliques', included: false },
      { text: 'Documentos rastreados', included: false },
      { text: 'Integração Bitrix24', included: false },
      { text: 'API access', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Profissional',
    description: 'Para profissionais que precisam de mais recursos',
    price: 'R$ 49',
    period: '/mês',
    cta: 'Começar Trial Grátis',
    popular: true,
    icon: Sparkles,
    gradient: 'from-primary to-accent',
    features: [
      { text: 'Emails ilimitados', included: true },
      { text: 'Notificações em tempo real', included: true },
      { text: 'Extensão Chrome', included: true },
      { text: 'Dashboard avançado', included: true },
      { text: 'Rastreamento de aberturas', included: true },
      { text: 'Rastreamento de cliques', included: true },
      { text: '10 documentos/mês', included: true },
      { text: 'Integração Bitrix24', included: true },
      { text: 'API access', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    description: 'Para equipes que precisam de controle total',
    price: 'R$ 199',
    period: '/mês',
    cta: 'Falar com Vendas',
    popular: false,
    icon: Building2,
    gradient: 'from-purple-500 to-violet-400',
    features: [
      { text: 'Emails ilimitados', included: true },
      { text: 'Notificações em tempo real', included: true },
      { text: 'Extensão Chrome', included: true },
      { text: 'Dashboard empresarial', included: true },
      { text: 'Rastreamento de aberturas', included: true },
      { text: 'Rastreamento de cliques', included: true },
      { text: 'Documentos ilimitados', included: true },
      { text: 'Integração Bitrix24', included: true },
      { text: 'API access', included: true },
      { text: 'Suporte prioritário 24/7', included: true },
    ],
  },
];

const trustSignals = [
  { icon: Shield, text: 'Dados criptografados', description: 'SSL/TLS 256-bit' },
  { icon: Clock, text: '99.9% Uptime', description: 'SLA garantido' },
  { icon: Users, text: '1.000+ clientes', description: 'Satisfação total' },
  { icon: Mail, text: 'LGPD Compliant', description: 'Seus dados seguros' },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-10 w-10"
                aria-label="Voltar para a página inicial"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="FUXICO"
                  className="h-10 w-10 rounded-xl object-cover shadow-lg"
                />
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">FUXICO</h1>
                  <p className="text-xs tracking-wide text-muted-foreground">Planos e Preços</p>
                </div>
              </div>
            </div>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 text-center sm:px-6 sm:py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Preços Simples e Transparentes
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mb-4 font-display text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Escolha o plano ideal para <span className="gradient-text">seu negócio</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Comece gratuitamente e faça upgrade quando precisar de mais recursos. Sem surpresas, sem
            taxas escondidas.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div key={plan.id} variants={fadeInUp}>
              <Card
                className={`hover-lift relative h-full transition-all duration-300 ${
                  plan.popular
                    ? 'border-primary shadow-glow'
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                    <Badge className="gradient-primary border-0 text-white shadow-lg">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 text-center">
                  <div
                    className={`mx-auto inline-flex rounded-xl bg-gradient-to-br p-3 ${plan.gradient} mb-4`}
                  >
                    <plan.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="ml-1 text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    onClick={() => navigate('/auth')}
                    className={`w-full ${
                      plan.popular ? 'gradient-primary border-0 text-white' : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-3 pt-4">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 text-sm ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                        )}
                        <span className={!feature.included ? 'line-through' : ''}>
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
      <section className="container mx-auto border-t border-border/50 px-4 py-12 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4"
        >
          {trustSignals.map((signal, index) => (
            <motion.div key={index} variants={fadeInUp} className="p-4 text-center">
              <div className="mb-3 inline-flex rounded-xl bg-muted/50 p-3">
                <signal.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm font-semibold">{signal.text}</div>
              <div className="text-xs text-muted-foreground">{signal.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ Preview */}
      <section className="container mx-auto px-4 py-12 pb-20 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-4 font-display text-2xl font-bold">Ainda tem dúvidas?</h2>
          <p className="mb-6 text-muted-foreground">
            Entre em contato conosco. Estamos aqui para ajudar!
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Falar com Suporte
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="gradient-primary border-0 text-white"
            >
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
