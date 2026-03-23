import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { scaleIn } from "./animations";

interface CTASectionProps {
  onNavigateAuth: () => void;
}

export const CTASection = ({ onNavigateAuth }: CTASectionProps) => (
  <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
    <motion.div
      className="relative rounded-3xl overflow-hidden max-w-5xl mx-auto"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn}
    >
      <div className="absolute inset-0 gradient-primary" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0tMi0yaC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative p-10 sm:p-14 md:p-20 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 shadow-xl"
        >
          <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </motion.div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-4 tracking-tight">
          Pronto para saber quem lê seus emails?
        </h2>
        <p className="text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto text-sm sm:text-lg">
          Comece gratuitamente agora mesmo. Sem cartão de crédito, sem compromisso.
        </p>
        <Button
          size="lg"
          variant="secondary"
          onClick={onNavigateAuth}
          className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover-lift press-effect rounded-xl"
        >
          Criar Conta Grátis
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  </section>
);
