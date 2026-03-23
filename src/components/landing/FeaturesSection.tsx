import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Eye, MousePointerClick, FileText, Building2, Shield, Bell } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

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

export const FeaturesSection = () => (
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
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${feature.bgGlow} opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500`} />
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
);
