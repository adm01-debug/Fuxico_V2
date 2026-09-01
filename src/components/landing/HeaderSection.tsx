import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import logoImg from "@/assets/logo.webp";
import { ThemeToggleButton } from "./ThemeToggleButton";

interface HeaderSectionProps {
  onNavigateAuth: () => void;
}

export const HeaderSection = ({ onNavigateAuth }: HeaderSectionProps) => (
  <motion.header className="border-b border-border/40 bg-background/70 backdrop-blur-2xl sticky top-0 z-50">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative group">
            <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-xl object-cover shadow-lg relative z-10" />
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
          </div>
          <div>
            <span className="text-2xl font-bold font-display tracking-tight">FUXICO</span>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Email Tracking Pro</p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center gap-2 sm:gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ThemeToggleButton />
          <Button variant="ghost" onClick={onNavigateAuth} className="font-medium h-10 px-3 sm:px-4 text-sm sm:text-base">
            Entrar
          </Button>
          <Button
            onClick={onNavigateAuth}
            className="gradient-primary text-white border-0 shadow-glow hover:shadow-glow-lg transition-all duration-300 press-effect h-10 px-3 sm:px-5 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Começar Grátis</span>
            <span className="sm:hidden">Iniciar</span>
            <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.header>
);
