import { motion } from "framer-motion";
import { Zap, Shield, Sparkles } from "lucide-react";
import logoImg from "@/assets/logo.webp";

const features = [
  { icon: Zap, text: "Tracking em tempo real" },
  { icon: Shield, text: "100% Seguro" },
  { icon: Sparkles, text: "IA Integrada" },
];

export const AuthHeader = () => (
  <motion.div
    className="flex flex-col items-center mb-8"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  >
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="absolute -inset-2 bg-gradient-to-r from-primary/50 to-primary/30 rounded-3xl blur-xl opacity-50" />
      <img src={logoImg} alt="FUXICO" className="relative h-20 w-20 rounded-2xl shadow-2xl" />
    </motion.div>

    <motion.h1
      className="text-4xl font-display font-bold mt-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      FUXICO
    </motion.h1>

    <motion.p
      className="text-muted-foreground mt-2 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Saiba quando seus emails são lidos
    </motion.p>

    <motion.div
      className="flex gap-2 mt-4 flex-wrap justify-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {features.map((feature, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.15)" }}
        >
          <feature.icon className="w-3 h-3" />
          {feature.text}
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);
