/**
 * @fileoverview Hook de onboarding para guiar novos usuários
 * @description Gerencia o fluxo de onboarding com tour interativo
 * e progresso persistido no banco de dados
 */

import { log } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TourConfig, getTour } from '@/lib/onboarding-config';

// ============================================
// TYPES
// ============================================

interface OnboardingState {
  currentTour: string | null;
  currentStep: number;
  isActive: boolean;
  completedTours: string[];
}

interface UseOnboardingReturn {
  // State
  currentTour: TourConfig | null;
  currentStep: number;
  isActive: boolean;
  totalSteps: number;
  progress: number;
  
  // Actions
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  goToStep: (step: number) => void;
  
  // Helpers
  hasCompletedTour: (tourId: string) => boolean;
  resetTour: (tourId: string) => void;
  resetAllTours: () => void;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'fuxico-onboarding';

function getStoredState(): Partial<OnboardingState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredState(state: Partial<OnboardingState>): void {
  try {
    const current = getStoredState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch {
    log.error('Failed to save onboarding state');
  }
}

// ============================================
// HOOK
// ============================================

/**
 * Hook principal de onboarding
 * @description Controla o tour interativo para novos usuários,
 * incluindo navegação entre steps, skip e conclusão
 * @returns {Object} Objeto contendo:
 *   - currentStep: Número do passo atual
 *   - totalSteps: Total de passos
 *   - isActive: Se o onboarding está ativo
 *   - nextStep: Função para avançar
 *   - prevStep: Função para voltar
 *   - skipOnboarding: Função para pular
 *   - completeOnboarding: Função para concluir
 * @example
 * const { currentStep, nextStep, skipOnboarding } = useOnboarding();
 */
export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(() => ({
    currentTour: null,
    currentStep: 0,
    isActive: false,
    completedTours: getStoredState().completedTours || [],
  }));

  const currentTourConfig = state.currentTour ? getTour(state.currentTour) : null;
  const totalSteps = currentTourConfig?.steps.length || 0;
  const progress = totalSteps > 0 ? ((state.currentStep + 1) / totalSteps) * 100 : 0;

  // ============================================
  // ACTIONS
  // ============================================

  const startTour = useCallback((tourId: string) => {
    const tour = getTour(tourId);
    if (!tour) {
      log.error(`Tour "${tourId}" not found`);
      return;
    }

    setState(prev => ({
      ...prev,
      currentTour: tourId,
      currentStep: 0,
      isActive: true,
    }));

    // Call onEnter for first step
    tour.steps[0]?.onEnter?.();
  }, []);

  const nextStep = useCallback(() => {
    if (!currentTourConfig) return;

    const currentStepConfig = currentTourConfig.steps[state.currentStep];
    currentStepConfig?.onExit?.();

    if (state.currentStep < totalSteps - 1) {
      const nextStepConfig = currentTourConfig.steps[state.currentStep + 1];
      nextStepConfig?.onEnter?.();
      
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      // Tour complete
      endTour();
    }
  }, [currentTourConfig, state.currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (!currentTourConfig || state.currentStep <= 0) return;

    const currentStepConfig = currentTourConfig.steps[state.currentStep];
    currentStepConfig?.onExit?.();

    const prevStepConfig = currentTourConfig.steps[state.currentStep - 1];
    prevStepConfig?.onEnter?.();

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, [currentTourConfig, state.currentStep]);

  const goToStep = useCallback((step: number) => {
    if (!currentTourConfig || step < 0 || step >= totalSteps) return;

    const currentStepConfig = currentTourConfig.steps[state.currentStep];
    currentStepConfig?.onExit?.();

    const targetStepConfig = currentTourConfig.steps[step];
    targetStepConfig?.onEnter?.();

    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, [currentTourConfig, state.currentStep, totalSteps]);

  const skipTour = useCallback(() => {
    if (currentTourConfig) {
      currentTourConfig.onSkip?.();
    }
    endTour();
  }, [currentTourConfig]);

  const endTour = useCallback(() => {
    if (currentTourConfig) {
      currentTourConfig.onComplete?.();
      
      // Mark as completed
      const newCompletedTours = [...state.completedTours];
      if (state.currentTour && !newCompletedTours.includes(state.currentTour)) {
        newCompletedTours.push(state.currentTour);
      }
      
      setStoredState({ completedTours: newCompletedTours });
      
      setState(prev => ({
        ...prev,
        currentTour: null,
        currentStep: 0,
        isActive: false,
        completedTours: newCompletedTours,
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentTour: null,
        currentStep: 0,
        isActive: false,
      }));
    }
  }, [currentTourConfig, state.completedTours, state.currentTour]);

  // ============================================
  // HELPERS
  // ============================================

  const hasCompletedTour = useCallback((tourId: string): boolean => {
    return state.completedTours.includes(tourId);
  }, [state.completedTours]);

  const resetTour = useCallback((tourId: string) => {
    const newCompletedTours = state.completedTours.filter(id => id !== tourId);
    setStoredState({ completedTours: newCompletedTours });
    setState(prev => ({
      ...prev,
      completedTours: newCompletedTours,
    }));
  }, [state.completedTours]);

  const resetAllTours = useCallback(() => {
    setStoredState({ completedTours: [] });
    setState(prev => ({
      ...prev,
      completedTours: [],
    }));
  }, []);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
        case 'Escape':
          skipTour();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, nextStep, prevStep, skipTour]);

  // ============================================
  // AUTO-START FIRST TIME TOUR
  // ============================================

  useEffect(() => {
    const checkFirstTime = async () => {
      // Check if user is authenticated and hasn't seen the first-time tour
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !hasCompletedTour('first-time')) {
        // Delay a bit to let the UI render
        setTimeout(() => {
          startTour('first-time');
        }, 1000);
      }
    };

    checkFirstTime();
  }, [hasCompletedTour, startTour]);

  return {
    currentTour: currentTourConfig,
    currentStep: state.currentStep,
    isActive: state.isActive,
    totalSteps,
    progress,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
    goToStep,
    hasCompletedTour,
    resetTour,
    resetAllTours,
  };
}

// ============================================
// CONTEXT (OPTIONAL)
// ============================================

import { createContext, useContext, ReactNode } from 'react';

const OnboardingContext = createContext<UseOnboardingReturn | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();
  
  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext(): UseOnboardingReturn {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}
