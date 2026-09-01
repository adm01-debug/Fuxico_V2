import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/use-theme';
import type { Theme } from '@/lib/theme-context';
import { motion, AnimatePresence } from "framer-motion";

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export const ThemeToggleButton = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-muted/80 transition-colors relative overflow-hidden touch-target"
          aria-label="Alternar tema"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={resolvedTheme}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <CurrentIcon className="h-5 w-5" />
            </motion.div>
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={`gap-2 cursor-pointer ${
              theme === value ? "bg-muted" : ""
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {theme === value && (
              <motion.div
                layoutId="theme-check"
                className="ml-auto w-2 h-2 rounded-full bg-primary"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
