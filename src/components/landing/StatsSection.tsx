import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Zap, Mail, Clock } from "lucide-react";
import { staggerContainer, scaleIn } from "./animations";

const stats = [
  { value: "99.9", suffix: "%", label: "Precisão de Rastreamento", icon: Target },
  { value: "<1", suffix: "s", label: "Tempo de Notificação", icon: Zap },
  { value: "100", suffix: "%", label: "Compatível com Gmail", icon: Mail },
  { value: "24", suffix: "/7", label: "Monitoramento Ativo", icon: Clock }
];

const AnimatedCounter = ({ value, suffix }: { value: string; suffix: string }) => {
  const [count, setCount] = useState(0);
  const numericValue = parseFloat(value.replace('<', ''));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountDelay = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(mountDelay);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const duration = 2000;
    const totalSteps = 60;
    const increment = numericValue / totalSteps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / totalSteps);
    return () => clearInterval(timer);
  }, [mounted, numericValue]);

  return (
    <span className="font-mono tabular-nums">
      {value.includes('<') ? '<' : ''}{numericValue % 1 !== 0 ? count.toFixed(1) : Math.round(count)}{suffix}
    </span>
  );
};

export const StatsSection = () => (
  <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-4xl mx-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={scaleIn}
          whileHover={{ y: -4, scale: 1.02 }}
          className="text-center p-5 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="inline-flex p-2 rounded-xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
            <stat.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-4xl font-bold gradient-text font-display">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);
