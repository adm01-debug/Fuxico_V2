import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import logoImg from '@/assets/logo.webp';
import { ThemeToggleButton } from './ThemeToggleButton';

interface HeaderSectionProps {
  onNavigateAuth: () => void;
}

export const HeaderSection = ({ onNavigateAuth }: HeaderSectionProps) => (
  <motion.header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="group relative">
            <img
              src={logoImg}
              alt="FUXICO"
              className="relative z-10 h-10 w-10 rounded-xl object-cover shadow-lg"
            />
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-accent opacity-30 blur transition-opacity duration-300 group-hover:opacity-60" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight">FUXICO</span>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Email Tracking Pro
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 sm:gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ThemeToggleButton />
          <Button
            variant="ghost"
            onClick={onNavigateAuth}
            className="h-10 px-3 text-sm font-medium sm:px-4 sm:text-base"
          >
            Entrar
          </Button>
          <Button
            onClick={onNavigateAuth}
            className="gradient-primary press-effect h-10 border-0 px-3 text-sm text-white shadow-glow transition-all duration-300 hover:shadow-glow-lg sm:px-5 sm:text-base"
          >
            <span className="hidden sm:inline">Começar Grátis</span>
            <span className="sm:hidden">Iniciar</span>
            <ArrowRight className="ml-1 h-4 w-4 sm:ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.header>
);
