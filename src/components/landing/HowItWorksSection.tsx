import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Globe, Users, Mail, Eye } from 'lucide-react';
import { fadeInUp, staggerContainer, scaleIn } from './animations';

const steps = [
  {
    number: '1',
    title: 'Instale a Extensão',
    description: 'Adicione o FUXICO ao seu Chrome em segundos',
    icon: Globe,
  },
  {
    number: '2',
    title: 'Faça Login',
    description: 'Use sua conta para sincronizar seus dados',
    icon: Users,
  },
  {
    number: '3',
    title: 'Envie Emails',
    description: 'O rastreamento é automático e invisível',
    icon: Mail,
  },
  {
    number: '4',
    title: 'Acompanhe',
    description: 'Veja quem abriu seus emails em tempo real',
    icon: Eye,
  },
];

export const HowItWorksSection = () => (
  <section className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />

    <motion.div
      className="relative mb-12 text-center sm:mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
        Como Funciona
      </Badge>
      <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        4 passos <span className="gradient-text">simples</span>
      </h2>
      <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
        Comece a rastrear seus emails em minutos
      </p>
    </motion.div>

    <motion.div
      className="relative mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {/* Connection line */}
      <div className="absolute left-[12%] right-[12%] top-12 hidden h-0.5 md:block">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
      </div>

      {steps.map((step, index) => (
        <motion.div key={index} variants={scaleIn} className="relative z-10 text-center">
          <motion.div
            className="relative mb-5 inline-block"
            whileHover={{ y: -4, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="gradient-primary flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-glow sm:h-16 sm:w-16 sm:text-2xl">
              {step.number}
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-card shadow-md sm:h-8 sm:w-8">
              <step.icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            </div>
          </motion.div>
          <h3 className="mb-1 font-display text-sm font-semibold sm:text-lg">{step.title}</h3>
          <p className="text-xs text-muted-foreground sm:text-sm">{step.description}</p>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
