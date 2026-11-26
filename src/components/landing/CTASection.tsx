import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { scaleIn } from './animations';

interface CTASectionProps {
  onNavigateAuth: () => void;
}

export const CTASection = ({ onNavigateAuth }: CTASectionProps) => (
  <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
    <motion.div
      className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn}
    >
      <div className="gradient-primary absolute inset-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0tMi0yaC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      <motion.div
        className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative p-10 text-center sm:p-14 md:p-20">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mb-6 inline-flex rounded-2xl bg-white/10 p-4 shadow-xl backdrop-blur-sm"
        >
          <Mail className="h-8 w-8 text-white sm:h-10 sm:w-10" />
        </motion.div>

        <h2 className="mb-4 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          Pronto para saber quem lê seus emails?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-sm text-white/80 sm:mb-10 sm:text-lg">
          Comece gratuitamente agora mesmo. Sem cartão de crédito, sem compromisso.
        </p>
        <Button
          size="lg"
          variant="secondary"
          onClick={onNavigateAuth}
          className="hover:shadow-3xl hover-lift press-effect h-12 rounded-xl px-8 text-base shadow-2xl transition-all duration-300 sm:h-14 sm:px-10 sm:text-lg"
        >
          Criar Conta Grátis
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  </section>
);
