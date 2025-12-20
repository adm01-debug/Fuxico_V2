// =============================================================================
// FUXICO - Utilitários de Acessibilidade
// Arquivo: src/lib/accessibility.ts
// =============================================================================

import { useCallback, useEffect, useRef } from 'react';

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Hook para gerenciar focus trap em modais/dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Salvar elemento com foco atual
    previousActiveElement.current = document.activeElement;

    // Encontrar elementos focáveis
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focar primeiro elemento
    firstElement?.focus();

    // Handler para Tab
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: se no primeiro, ir para último
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: se no último, ir para primeiro
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar foco anterior
      (previousActiveElement.current as HTMLElement)?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Retorna todos os elementos focáveis dentro de um container
 */
export function getFocusableElements(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll(
    'button:not([disabled]), ' +
    'a[href], ' +
    'input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), ' +
    'textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"]):not([disabled]), ' +
    '[contenteditable="true"]'
  );
}

// =============================================================================
// ANÚNCIOS PARA SCREEN READERS
// =============================================================================

/**
 * Anuncia mensagem para screen readers via aria-live
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcer = getOrCreateAnnouncer(priority);
  
  // Limpar e adicionar mensagem (força anúncio)
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * Obtém ou cria o elemento announcer
 */
function getOrCreateAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
  const id = `fuxico-announcer-${priority}`;
  let announcer = document.getElementById(id);
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    
    // Visualmente oculto mas acessível para screen readers
    Object.assign(announcer.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    
    document.body.appendChild(announcer);
  }
  
  return announcer;
}

/**
 * Hook para anunciar mudanças de estado
 */
export function useAnnounce() {
  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message, priority);
  }, []);
}

// =============================================================================
// SKIP LINKS
// =============================================================================

/**
 * Componente de skip links (pular navegação)
 */
export function SkipLinks() {
  const links = [
    { href: '#main-content', label: 'Pular para o conteúdo principal' },
    { href: '#main-navigation', label: 'Pular para a navegação' },
  ];

  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className="absolute top-0 left-0 z-50 p-4 bg-primary text-primary-foreground focus:outline-none focus:ring-2"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

// =============================================================================
// ARIA HELPERS
// =============================================================================

/**
 * Gera ID único para elementos ARIA
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props de acessibilidade para tabelas
 */
export interface AccessibleTableProps {
  caption: string;
  sortable?: boolean;
  currentSort?: { column: string; direction: 'asc' | 'desc' };
}

export function getTableAriaProps(props: AccessibleTableProps) {
  return {
    role: 'table',
    'aria-label': props.caption,
    ...(props.sortable && { 'aria-sort': props.currentSort?.direction }),
  };
}

/**
 * Props de acessibilidade para colunas ordenáveis
 */
export function getSortableColumnProps(
  columnId: string,
  currentSort?: { column: string; direction: 'asc' | 'desc' }
) {
  const isSorted = currentSort?.column === columnId;
  const direction = isSorted ? currentSort.direction : undefined;
  
  return {
    role: 'columnheader',
    'aria-sort': isSorted 
      ? (direction === 'asc' ? 'ascending' : 'descending') 
      : 'none',
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (e.target as HTMLElement).click();
      }
    },
  };
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Hook para navegação por setas em lista
 */
export function useArrowNavigation<T extends HTMLElement>(
  itemCount: number,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<T>) => {
    const { key } = e;
    let newIndex = currentIndex.current;
    
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';
    
    if ((key === 'ArrowDown' && isVertical) || (key === 'ArrowRight' && isHorizontal)) {
      e.preventDefault();
      newIndex = currentIndex.current + 1;
      if (newIndex >= itemCount) {
        newIndex = loop ? 0 : itemCount - 1;
      }
    } else if ((key === 'ArrowUp' && isVertical) || (key === 'ArrowLeft' && isHorizontal)) {
      e.preventDefault();
      newIndex = currentIndex.current - 1;
      if (newIndex < 0) {
        newIndex = loop ? itemCount - 1 : 0;
      }
    } else if (key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (key === 'End') {
      e.preventDefault();
      newIndex = itemCount - 1;
    } else if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      onSelect?.(currentIndex.current);
      return;
    }
    
    if (newIndex !== currentIndex.current) {
      currentIndex.current = newIndex;
      // Focar no novo item
      const container = e.currentTarget;
      const items = container.querySelectorAll('[role="option"], [role="menuitem"], [data-nav-item]');
      (items[newIndex] as HTMLElement)?.focus();
    }
  }, [itemCount, loop, orientation, onSelect]);

  return {
    handleKeyDown,
    setCurrentIndex: (index: number) => { currentIndex.current = index; },
  };
}

// =============================================================================
// REDUCED MOTION
// =============================================================================

/**
 * Hook para detectar preferência de movimento reduzido
 */
export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  
  // SSR safe
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia(query);
  const [prefersReducedMotion, setPrefersReducedMotion] = 
    React.useState(mediaQuery.matches);

  useEffect(() => {
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// =============================================================================
// COMPONENTES ACESSÍVEIS
// =============================================================================

import React from 'react';

/**
 * Texto visualmente oculto mas acessível para screen readers
 */
export function VisuallyHidden({ 
  children,
  as: Component = 'span',
}: { 
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
    >
      {children}
    </Component>
  );
}

/**
 * Indicador de loading acessível
 */
export function AccessibleLoading({ 
  label = 'Carregando...',
}: { 
  label?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <VisuallyHidden>{label}</VisuallyHidden>
      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * Wrapper para formulários acessíveis
 */
export function AccessibleForm({
  children,
  onSubmit,
  ariaLabel,
  ariaDescribedBy,
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  ariaLabel: string;
  ariaDescribedBy?: string;
}) {
  return (
    <form
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      noValidate
    >
      {children}
    </form>
  );
}

// =============================================================================
// VALIDAÇÃO DE ACESSIBILIDADE (DEV ONLY)
// =============================================================================

/**
 * Verifica problemas de acessibilidade em desenvolvimento
 */
export function checkAccessibility(element: HTMLElement): string[] {
  const issues: string[] = [];
  
  // Verificar imagens sem alt
  element.querySelectorAll('img').forEach((img, i) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Imagem #${i + 1} sem atributo alt`);
    }
  });
  
  // Verificar botões sem texto acessível
  element.querySelectorAll('button').forEach((btn, i) => {
    if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
      issues.push(`Botão #${i + 1} sem texto ou aria-label`);
    }
  });
  
  // Verificar links sem texto
  element.querySelectorAll('a').forEach((link, i) => {
    if (!link.textContent?.trim() && !link.getAttribute('aria-label')) {
      issues.push(`Link #${i + 1} sem texto ou aria-label`);
    }
  });
  
  // Verificar inputs sem label
  element.querySelectorAll('input, select, textarea').forEach((input, i) => {
    const id = input.getAttribute('id');
    const hasLabel = id && element.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel) {
      issues.push(`Campo de formulário #${i + 1} sem label associado`);
    }
  });
  
  return issues;
}
