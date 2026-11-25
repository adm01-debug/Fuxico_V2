import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { CheckCircle2, BarChart3, Users, Clock, Globe } from 'lucide-react';
import { staggerContainer, slideInLeft, slideInRight } from './animations';

const benefits = [
  { title: '100% Invisível', desc: 'O destinatário nunca sabe que está sendo rastreado' },
  {
    title: 'Detecção de Self-Opens',
    desc: 'Ignora automaticamente quando você mesmo abre o email',
  },
  { title: 'Integração com CRM', desc: 'Sincronize atividades automaticamente com Bitrix24' },
  { title: 'Auditoria Completa', desc: 'Controle total sobre emails da sua equipe' },
];

const benefitStats = [
  {
    icon: BarChart3,
    value: '+300%',
    label: 'Taxa de Follow-up',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    icon: Users,
    value: '1.000+',
    label: 'Usuários Ativos',
    gradient: 'from-violet-500 to-purple-600',
  },
  { icon: Clock, value: '2h', label: 'Economia/Dia', gradient: 'from-emerald-500 to-green-600' },
  { icon: Globe, value: 'Global', label: 'Rastreamento', gradient: 'from-amber-500 to-orange-600' },
];

export const BenefitsSection = () => (
  <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
    <motion.div
      className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-16 md:grid-cols-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      <motion.div variants={slideInLeft}>
        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
          Benefícios
        </Badge>
        <h2 className="mb-8 font-display text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Por que escolher o <span className="gradient-text">FUXICO</span>?
        </h2>
        <div className="space-y-4">
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              className="group flex cursor-default items-start gap-4 rounded-xl p-4 transition-all duration-300 hover:bg-muted/50"
              whileHover={{ x: 6 }}
            >
              <div className="gradient-success flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-md transition-shadow group-hover:shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-display text-base font-semibold transition-colors group-hover:text-primary sm:text-lg">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={slideInRight} className="grid grid-cols-2 gap-4">
        {benefitStats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="border bg-card/60 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-6">
              <div
                className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 ${stat.gradient} mb-3 shadow-lg`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="gradient-text font-display text-2xl font-bold sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  </section>
);
