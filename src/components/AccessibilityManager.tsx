import { useEffect } from 'react';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function AccessibilityManager() {
  const { preferences } = useUserPreferences();

  useEffect(() => {
    if (preferences?.font_size) {
      document.documentElement.style.fontSize = `${preferences.font_size}px`;
    } else {
      // Default font size if not set or preferred
      document.documentElement.style.fontSize = '16px';
    }
    
    // Cleanup if component unmounts (though it's intended to stay mounted)
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [preferences?.font_size]);

  return null;
}
