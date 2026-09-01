import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/logger';

/** Estado do tour guiado (execução, passo atual e identificador). */
export interface TourState {
  run: boolean;
  stepIndex: number;
  tourId: string;
}

/** Gerencia início, conclusão e persistência dos tours de onboarding. */
export function useOnboardingTour() {
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('fuxico-completed-tours', []);
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    stepIndex: 0,
    tourId: '',
  });

  const startTour = useCallback((tourId: string = 'dashboard') => {
    setTourState({
      run: true,
      stepIndex: 0,
      tourId,
    });
  }, []);

  const stopTour = useCallback(() => {
    setTourState(prev => ({ ...prev, run: false }));
  }, []);

  const completeTour = useCallback((tourId: string) => {
    if (!completedTours.includes(tourId)) {
      setCompletedTours([...completedTours, tourId]);
    }
    stopTour();
  }, [completedTours, setCompletedTours, stopTour]);

  const resetTour = useCallback((tourId: string) => {
    setCompletedTours(completedTours.filter(id => id !== tourId));
  }, [completedTours, setCompletedTours]);

  const resetAllTours = useCallback(() => {
    setCompletedTours([]);
  }, [setCompletedTours]);

  const hasCompletedTour = useCallback((tourId: string) => {
    return completedTours.includes(tourId);
  }, [completedTours]);

  // Auto-start tour for new users
  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !hasCompletedTour('dashboard')) {
          // Wait for page to render
          setTimeout(() => {
            startTour('dashboard');
          }, 1500);
        }
      } catch (error) {
        log.error('Error checking new user for tour:', error);
      }
    };

    checkNewUser();
  }, [hasCompletedTour, startTour]);

  return {
    tourState,
    startTour,
    stopTour,
    completeTour,
    resetTour,
    resetAllTours,
    hasCompletedTour,
    setTourState,
    completedTours,
  };
}
