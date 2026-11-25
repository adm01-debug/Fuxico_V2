import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Eye, MousePointerClick, FileText, Building2, Shield, Bell } from 'lucide-react';
import { fadeInUp, staggerContainer } from './animations';

const features = [
  {
    icon: Eye,
    title: 'Rastreamento de Aberturas',
    description: 'Saiba exatamente quando seu email foi aberto com precisão de segundos',
    gradient: 'from-sky-500 to-blue-600',
    bgGlow: 'bg-sky-500/10',
  },
  {
    icon: MousePointerClick,
    title: 'Cliques em Links',
    description: 'Monitore quais links foram clicados e quantas vezes',
    gradient: 'from-emerald-500 to-green-600',
    bgGlow: 'bg-emerald-500/10',
  },
  {
    icon: FileText,
    title: 'Documentos Rastreados',
    description: 'Envie PDFs e documentos com rastreamento de visualização por página',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'bg-violet-500/10',
  },
  {
    icon: Building2,
    title: 'Integração Bitrix24',
    description: 'Sincronize automaticamente com seu CRM favorito',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Auditoria Empresarial',
    description: 'Controle total sobre emails enviados e recebidos pela equipe',
    gradient: 'from-rose-500 to-red-600',
    bgGlow: 'bg-rose-500/10',
  },
  {
    icon: Bell,
    title: 'Notificações em Tempo Real',
    description: 'Receba alertas instantâneos quando seus emails são lidos',
    gradient: 'from-yellow-500 to-orange-500',
    bgGlow: 'bg-yellow-500/10',
  },
];

export const FeaturesSection = () => (
  <section id="features-section" className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24">
    <motion.div
      className="mb-12 text-center sm:mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
        Funcionalidades
      </Badge>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Tudo que você precisa para <span className="gradient-text">vender mais</span>
      </h2>
      <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
        Funcionalidades poderosas para controle total sobre sua comunicação
      </p>
    </motion.div>

    <motion.div
      className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {features.map((feature, index) => (
        <motion.div key={index} variants={fadeInUp}>
          <Card className="group h-full overflow-hidden border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <CardContent className="relative p-6 sm:p-8">
              <div
                className={`absolute -right-20 -top-20 h-40 w-40 rounded-full ${feature.bgGlow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <div
                className={`relative inline-flex rounded-xl bg-gradient-to-br p-3 ${feature.gradient} mb-4 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
              >
                <feature.icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="relative mb-2 font-display text-lg font-semibold transition-colors group-hover:text-primary sm:text-xl">
                {feature.title}
              </h3>
              <p className="relative text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
