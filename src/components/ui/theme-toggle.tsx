import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
