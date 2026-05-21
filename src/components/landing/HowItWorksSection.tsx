import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Globe, Users, Mail, Eye } from "lucide-react";
import { fadeInUp, staggerContainer, scaleIn } from "./animations";

const steps = [
  { number: "1", title: "Instale a Extensão", description: "Adicione o FUXICO ao seu Chrome em segundos", icon: Globe },
  { number: "2", title: "Faça Login", description: "Use sua conta para sincronizar seus dados", icon: Users },
  { number: "3", title: "Envie Emails", description: "O rastreamento é automático e invisível", icon: Mail },
  { number: "4", title: "Acompanhe", description: "Veja quem abriu seus emails em tempo real", icon: Eye }
];

export const HowItWorksSection = () => (
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
        <motion.div key={index} variants={scaleIn} className="text-center relative z-10">
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
);
