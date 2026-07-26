import { useEffect } from 'react';
import { useAccessibility } from '@/hooks/use-accessibility';

export function AccessibilityManager() {
  const { fontSize, motionPreference, contrastPreference } = useAccessibility();

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    if (motionPreference === "reduce") {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    if (contrastPreference === "high") {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [fontSize, motionPreference, contrastPreference]);

  return null;
}
