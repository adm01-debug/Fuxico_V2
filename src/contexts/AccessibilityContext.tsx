import { useEffect, useState, ReactNode } from "react";
import {
  AccessibilityContext,
  type MotionPreference,
  type ContrastPreference,
} from "@/contexts/accessibility-context";


export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fuxico-font-size");
    return saved ? parseInt(saved, 10) : 16;
  });

  const [motionPreference, setMotionPreference] = useState<MotionPreference>(() => {
    const saved = localStorage.getItem("fuxico-motion-pref");
    if (saved) return saved as MotionPreference;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference";
  });

  const [contrastPreference, setContrastPreference] = useState<ContrastPreference>(() => {
    const saved = localStorage.getItem("fuxico-contrast-pref");
    return (saved as ContrastPreference) || "standard";
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fuxico-font-size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    if (motionPreference === "reduce") {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    localStorage.setItem("fuxico-motion-pref", motionPreference);
  }, [motionPreference]);

  useEffect(() => {
    if (contrastPreference === "high") {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("fuxico-contrast-pref", contrastPreference);
  }, [contrastPreference]);

  return (
    <AccessibilityContext.Provider 
      value={{ 
        fontSize, setFontSize, 
        motionPreference, setMotionPreference, 
        contrastPreference, setContrastPreference 
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

