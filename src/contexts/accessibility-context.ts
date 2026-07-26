import { createContext } from 'react';

/** Preferência de movimento/animações do usuário. */
export type MotionPreference = 'no-preference' | 'reduce';
/** Preferência de contraste do usuário. */
export type ContrastPreference = 'standard' | 'high';

/** Contrato exposto pelo `AccessibilityProvider`. */
export interface AccessibilityContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  motionPreference: MotionPreference;
  setMotionPreference: (pref: MotionPreference) => void;
  contrastPreference: ContrastPreference;
  setContrastPreference: (pref: ContrastPreference) => void;
}

/** Contexto isolado do provedor para preservar o Fast Refresh. */
export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
