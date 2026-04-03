// =============================================================================
// FUXICO - Tailwind Config Verification Tests
// Validates design system integration with Tailwind
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const tailwindConfig = fs.readFileSync(
  path.resolve(__dirname, '../../../tailwind.config.ts'),
  'utf-8'
);

describe('Tailwind - Color Tokens', () => {
  const requiredColors = [
    'background', 'foreground', 'primary', 'secondary',
    'muted', 'accent', 'destructive', 'card', 'popover',
    'border', 'input', 'ring',
  ];

  requiredColors.forEach(color => {
    it(`should define '${color}' color`, () => {
      expect(tailwindConfig).toContain(color);
    });
  });
});

describe('Tailwind - Sidebar Colors', () => {
  it('should define sidebar colors', () => {
    expect(tailwindConfig).toContain('sidebar');
  });
});

describe('Tailwind - Border Radius', () => {
  it('should define border radius using CSS variable', () => {
    expect(tailwindConfig).toContain('--radius');
  });
});

describe('Tailwind - Font Family', () => {
  it('should reference font-display variable', () => {
    const hasFont = tailwindConfig.includes('font-display') || tailwindConfig.includes('Space Grotesk');
    expect(hasFont).toBe(true);
  });
});

describe('Tailwind - Animations', () => {
  it('should define custom animations', () => {
    expect(tailwindConfig).toContain('animation');
  });

  it('should define keyframes', () => {
    expect(tailwindConfig).toContain('keyframes');
  });

  it('should include fade-in animation', () => {
    expect(tailwindConfig).toContain('fade-in');
  });
});

describe('Tailwind - Plugin Integration', () => {
  it('should use tailwindcss-animate plugin', () => {
    expect(tailwindConfig).toContain('tailwindcss-animate');
  });
});

describe('Tailwind - Content Configuration', () => {
  it('should scan source files', () => {
    expect(tailwindConfig).toContain('src');
  });

  it('should scan components', () => {
    expect(tailwindConfig).toContain('components');
  });
});
