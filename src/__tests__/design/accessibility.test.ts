// =============================================================================
// FUXICO - Accessibility & Responsiveness Tests
// Validates a11y patterns, responsive utilities, ARIA attributes
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const accessibilityCss = fs.readFileSync(
  path.resolve(__dirname, '../../styles/accessibility.css'),
  'utf-8'
);

const responsiveCss = fs.readFileSync(
  path.resolve(__dirname, '../../styles/responsive-xl.css'),
  'utf-8'
);

const indexCss = fs.readFileSync(
  path.resolve(__dirname, '../../index.css'),
  'utf-8'
);

describe('Accessibility CSS', () => {
  it('should exist and have content', () => {
    expect(accessibilityCss.length).toBeGreaterThan(0);
  });

  it('should define focus-visible styles', () => {
    expect(accessibilityCss).toContain('focus-visible');
  });

  it('should handle prefers-reduced-motion', () => {
    expect(accessibilityCss).toContain('prefers-reduced-motion');
  });

  it('should define sr-only utility', () => {
    expect(accessibilityCss.includes('sr-only') || indexCss.includes('sr-only')).toBe(true);
  });
});

describe('Responsive CSS', () => {
  it('should exist and have content', () => {
    expect(responsiveCss.length).toBeGreaterThan(0);
  });

  it('should define breakpoints or media queries', () => {
    expect(responsiveCss).toContain('@media');
  });
});

describe('Index CSS - Animations', () => {
  it('should define fade-in animation', () => {
    expect(indexCss).toContain('fade-in');
  });

  it('should define keyframes', () => {
    expect(indexCss).toContain('@keyframes');
  });

  it('should import font files', () => {
    expect(indexCss).toContain('@import');
    expect(indexCss).toContain('space-grotesk');
    expect(indexCss).toContain('jetbrains-mono');
  });
});

describe('ARIA & Semantic HTML Patterns', () => {
  const searchDialogContent = fs.readFileSync(
    path.resolve(__dirname, '../../components/dashboard/GlobalSearchDialog.tsx'),
    'utf-8'
  );

  it('GlobalSearchDialog should use aria-label', () => {
    expect(searchDialogContent).toContain('aria-label');
  });

  it('GlobalSearchDialog should use role attribute', () => {
    expect(searchDialogContent).toContain('role=');
  });

  it('GlobalSearchDialog should use CommandDialog (accessible)', () => {
    expect(searchDialogContent).toContain('CommandDialog');
  });

  it('GlobalSearchDialog should use CommandInput', () => {
    expect(searchDialogContent).toContain('CommandInput');
  });

  it('GlobalSearchDialog should use CommandList', () => {
    expect(searchDialogContent).toContain('CommandList');
  });

  it('GlobalSearchDialog should use CommandEmpty for no results', () => {
    expect(searchDialogContent).toContain('CommandEmpty');
  });

  it('GlobalSearchDialog should use CommandGroup for grouping', () => {
    expect(searchDialogContent).toContain('CommandGroup');
  });

  it('GlobalSearchDialog should use CommandItem for items', () => {
    expect(searchDialogContent).toContain('CommandItem');
  });
});
