import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type MotionPreference = "no-preference" | "reduce";
type ContrastPreference = "standard" | "high";

interface AccessibilityContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  motionPreference: MotionPreference;
  setMotionPreference: (pref: MotionPreference) => void;
  contrastPreference: ContrastPreference;
  setContrastPreference: (pref: ContrastPreference) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

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

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return context;
};
