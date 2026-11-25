import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ScrollIndicatorProps {
  targetId?: string;
  className?: string;
}

export const ScrollIndicator = ({ targetId, className = '' }: ScrollIndicatorProps) => {
  const handleClick = () => {
    if (targetId) {
      const element = document.getElementById(targetId);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      aria-label="Rolar para baixo"
    >
      <span className="text-xs font-medium">Descubra mais</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </motion.button>
  );
};

// Progress indicator for long pages
export const ScrollProgress = () => {
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-primary to-accent"
      style={{ scaleX: 0 }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
    />
  );
};

// Section indicator dots
interface SectionDotsProps {
  sections: string[];
  activeSection: number;
  onSectionClick: (index: number) => void;
}

export const SectionDots = ({ sections, activeSection, onSectionClick }: SectionDotsProps) => {
  return (
    <div className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 transform flex-col gap-3 lg:flex">
      {sections.map((section, index) => (
        <button
          key={section}
          onClick={() => onSectionClick(index)}
          className="group relative flex items-center justify-end"
          aria-label={`Ir para seção ${section}`}
        >
          <span className="absolute right-6 whitespace-nowrap text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {section}
          </span>
          <motion.div
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              activeSection === index
                ? 'w-6 bg-primary'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            whileHover={{ scale: 1.2 }}
          />
        </button>
      ))}
    </div>
  );
};
