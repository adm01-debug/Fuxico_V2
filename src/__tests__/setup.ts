// =============================================================================
// FUXICO - Vitest Setup
// Arquivo: src/__tests__/setup.ts
// Descrição: Configuração global para testes unitários
// =============================================================================

/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

import '@testing-library/jest-dom';

// Mock do ResizeObserver (não disponível no jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock do IntersectionObserver (não disponível no jsdom)
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock do scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock do localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do sessionStorage
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Suprimir console.error e console.warn em testes (opcional)
// Descomente se necessário:
// console.error = () => {};
// console.warn = () => {};

// Clean up após cada teste
afterEach(() => {
  // Limpar qualquer mock ou estado global se necessário
});
