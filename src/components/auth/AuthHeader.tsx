import { motion } from 'framer-motion';
import { Zap, Shield, Sparkles } from 'lucide-react';
import logoImg from '@/assets/logo.webp';

const features = [
  { icon: Zap, text: 'Tracking em tempo real' },
  { icon: Shield, text: '100% Seguro' },
  { icon: Sparkles, text: 'IA Integrada' },
];

export const AuthHeader = () => (
  <motion.div
    className="mb-8 flex flex-col items-center"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/50 to-primary/30 opacity-50 blur-xl" />
      <img src={logoImg} alt="FUXICO" className="relative h-20 w-20 rounded-2xl shadow-2xl" />
    </motion.div>

    <motion.h1
      className="mt-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-display text-4xl font-bold text-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      FUXICO
    </motion.h1>

    <motion.p
      className="mt-2 text-center text-muted-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Saiba quando seus emails são lidos
    </motion.p>

    <motion.div
      className="mt-4 flex flex-wrap justify-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {features.map((feature, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.15)' }}
        >
          <feature.icon className="h-3 w-3" />
          {feature.text}
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
