import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, BarChart3, Users, Clock, Globe } from "lucide-react";
import { staggerContainer, slideInLeft, slideInRight } from "./animations";

const benefits = [
  { title: "100% Invisível", desc: "O destinatário nunca sabe que está sendo rastreado" },
  { title: "Detecção de Self-Opens", desc: "Ignora automaticamente quando você mesmo abre o email" },
  { title: "Integração com CRM", desc: "Sincronize atividades automaticamente com Bitrix24" },
  { title: "Auditoria Completa", desc: "Controle total sobre emails da sua equipe" }
];

const benefitStats = [
  { icon: BarChart3, value: "+300%", label: "Taxa de Follow-up", gradient: "from-sky-500 to-blue-600" },
  { icon: Users, value: "1.000+", label: "Usuários Ativos", gradient: "from-violet-500 to-purple-600" },
  { icon: Clock, value: "2h", label: "Economia/Dia", gradient: "from-emerald-500 to-green-600" },
  { icon: Globe, value: "Global", label: "Rastreamento", gradient: "from-amber-500 to-orange-600" }
];

export const BenefitsSection = () => (
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
          {benefits.map((item, index) => (
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

      <motion.div variants={slideInRight} className="grid grid-cols-2 gap-4">
        {benefitStats.map((stat, index) => (
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
);
