import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Globe
} from "lucide-react";
import logoImg from "@/assets/logo.jpg";

const features = [
  {
    icon: Eye,
    title: "Rastreamento de Aberturas",
    description: "Saiba exatamente quando seu email foi aberto com precisão de segundos",
    color: "text-blue-500"
  },
  {
    icon: MousePointerClick,
    title: "Cliques em Links",
    description: "Monitore quais links foram clicados e quantas vezes",
    color: "text-green-500"
  },
  {
    icon: FileText,
    title: "Documentos Rastreados",
    description: "Envie PDFs e documentos com rastreamento de visualização",
    color: "text-purple-500"
  },
  {
    icon: Building2,
    title: "Integração Bitrix24",
    description: "Sincronize automaticamente com seu CRM favorito",
    color: "text-orange-500"
  },
  {
    icon: Shield,
    title: "Auditoria Empresarial",
    description: "Controle total sobre emails enviados e recebidos pela equipe",
    color: "text-red-500"
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description: "Receba alertas instantâneos quando seus emails são lidos",
    color: "text-yellow-500"
  }
];

const stats = [
  { value: "99.9%", label: "Precisão de Rastreamento" },
  { value: "<1s", label: "Tempo de Notificação" },
  { value: "100%", label: "Compatível com Gmail" },
  { value: "24/7", label: "Monitoramento Ativo" }
];

const steps = [
  {
    number: "1",
    title: "Instale a Extensão",
    description: "Adicione o FUXICO ao seu Chrome em segundos"
  },
  {
    number: "2",
    title: "Faça Login",
    description: "Use sua conta para sincronizar seus dados"
  },
  {
    number: "3",
    title: "Envie Emails",
    description: "O rastreamento é automático e invisível"
  },
  {
    number: "4",
    title: "Acompanhe",
    description: "Veja quem abriu seus emails em tempo real"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se já está logado, redireciona para o dashboard
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-lg object-cover" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">FUXICO</h1>
                <p className="text-xs text-muted-foreground">Email Tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Começar Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-3 w-3 mr-1" />
            Novo: Integração com Bitrix24
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Saiba quando seus
            <span className="text-primary"> emails são lidos</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            O FUXICO rastreia aberturas, cliques e visualizações dos seus emails de forma 
            invisível e precisa. Perfeito para vendas, follow-ups e comunicação empresarial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="w-full sm:w-auto">
              <Mail className="mr-2 h-5 w-5" />
              Começar Agora - É Grátis
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
              <Chrome className="h-5 w-5" />
              Instalar Extensão
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Tudo que você precisa para rastrear emails
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades poderosas para você e sua equipe terem controle total sobre a comunicação por email
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-6 py-20 border-t bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Em 4 passos simples você já estará rastreando seus emails
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20 border-t">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Por que escolher o FUXICO?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">100% Invisível</h4>
                  <p className="text-sm text-muted-foreground">O destinatário nunca sabe que está sendo rastreado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Detecção de Self-Opens</h4>
                  <p className="text-sm text-muted-foreground">Ignora automaticamente quando você mesmo abre o email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Integração com CRM</h4>
                  <p className="text-sm text-muted-foreground">Sincronize atividades automaticamente com Bitrix24</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Auditoria Completa</h4>
                  <p className="text-sm text-muted-foreground">Controle total sobre emails da sua equipe</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">+300%</div>
              <div className="text-xs text-muted-foreground">Taxa de Follow-up</div>
            </Card>
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">1000+</div>
              <div className="text-xs text-muted-foreground">Usuários Ativos</div>
            </Card>
            <Card className="p-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">2h</div>
              <div className="text-xs text-muted-foreground">Economia/Dia</div>
            </Card>
            <Card className="p-6 text-center">
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">Global</div>
              <div className="text-xs text-muted-foreground">Rastreamento</div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 border-t">
        <div className="bg-primary rounded-2xl p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Pronto para saber quem lê seus emails?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Comece gratuitamente agora mesmo. Sem cartão de crédito, sem compromisso.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="FUXICO" className="h-8 w-8 rounded-lg object-cover" />
              <span className="font-semibold">FUXICO</span>
              <span className="text-muted-foreground text-sm">by Promo Brindes</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 FUXICO. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
