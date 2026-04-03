// =============================================================================
// FUXICO - Design Tokens Verification Tests
// Validates CSS custom properties, elevation system, spacing scale, etc.
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const cssContent = fs.readFileSync(path.resolve(__dirname, '../../index.css'), 'utf-8');

describe('Design Tokens - Core Colors', () => {
  const requiredColors = [
    '--background', '--foreground',
    '--card', '--card-foreground',
    '--popover', '--popover-foreground',
    '--primary', '--primary-foreground', '--primary-glow',
    '--secondary', '--secondary-foreground',
    '--muted', '--muted-foreground',
    '--accent', '--accent-foreground',
    '--destructive', '--destructive-foreground',
    '--success', '--success-foreground',
    '--warning', '--warning-foreground',
    '--border', '--input', '--ring',
  ];

  requiredColors.forEach(token => {
    it(`should define ${token} in :root`, () => {
      expect(cssContent).toContain(token);
    });
  });

  it('should define all colors in HSL format (no hex or rgb for theme tokens)', () => {
    const rootBlock = cssContent.match(/:root\s*\{([^}]+)\}/s)?.[1] || '';
    const colorLines = rootBlock.split('\n').filter(l => 
      l.includes('--background:') || l.includes('--primary:') || l.includes('--foreground:')
    );
    colorLines.forEach(line => {
      // HSL values should be space-separated numbers like "220 90% 56%"
      const value = line.split(':')[1]?.trim().replace(';', '');
      if (value && !value.includes('var(') && !value.includes('linear-gradient')) {
        expect(value).toMatch(/\d+\s+\d+%?\s+\d+%/);
      }
    });
  });
});

describe('Design Tokens - Dark Mode', () => {
  it('should define .dark theme variant', () => {
    expect(cssContent).toContain('.dark');
  });

  const darkTokens = [
    '--background', '--foreground', '--primary', '--card',
    '--secondary', '--muted', '--accent', '--destructive',
    '--border', '--input', '--ring',
  ];

  darkTokens.forEach(token => {
    it(`should override ${token} in dark mode`, () => {
      const darkBlock = cssContent.match(/\.dark\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s)?.[1] || '';
      expect(darkBlock).toContain(token);
    });
  });
});

describe('Design Tokens - Elevation System', () => {
  it('should define 3-level elevation system', () => {
    expect(cssContent).toContain('--elevation-sm');
    expect(cssContent).toContain('--elevation-md');
    expect(cssContent).toContain('--elevation-lg');
  });

  it('elevation values should use hsl with primary color reference', () => {
    const elevationLines = cssContent.split('\n').filter(l => l.includes('--elevation-'));
    elevationLines.forEach(line => {
      expect(line).toContain('hsl');
    });
  });
});

describe('Design Tokens - Spacing Scale', () => {
  const spacingTokens = [
    { token: '--space-1', value: '0.25rem' },
    { token: '--space-2', value: '0.5rem' },
    { token: '--space-3', value: '0.75rem' },
    { token: '--space-4', value: '1rem' },
    { token: '--space-6', value: '1.5rem' },
    { token: '--space-8', value: '2rem' },
    { token: '--space-12', value: '3rem' },
    { token: '--space-16', value: '4rem' },
  ];

  spacingTokens.forEach(({ token, value }) => {
    it(`should define ${token} as ${value}`, () => {
      expect(cssContent).toContain(token);
      expect(cssContent).toContain(value);
    });
  });

  it('spacing scale should follow 4px base grid', () => {
    const baseUnit = 4;
    const expectedValues = [1, 2, 3, 4, 6, 8, 12, 16];
    expectedValues.forEach(multiplier => {
      const pxValue = baseUnit * multiplier;
      const remValue = pxValue / 16;
      expect(cssContent).toContain(`${remValue}rem`);
    });
  });
});

describe('Design Tokens - Typography', () => {
  it('should define font families', () => {
    expect(cssContent).toContain('--font-display');
    expect(cssContent).toContain('--font-body');
    expect(cssContent).toContain('--font-mono');
  });

  it('should use Space Grotesk for display and body', () => {
    expect(cssContent).toContain("'Space Grotesk'");
  });

  it('should use JetBrains Mono for monospace', () => {
    expect(cssContent).toContain("'JetBrains Mono'");
  });

  const typeScaleTokens = [
    '--text-xs', '--text-sm', '--text-base', '--text-lg',
    '--text-xl', '--text-2xl', '--text-3xl', '--text-4xl', '--text-5xl',
  ];

  typeScaleTokens.forEach(token => {
    it(`should define type scale token ${token}`, () => {
      expect(cssContent).toContain(token);
    });
  });

  it('should define letter spacing tokens', () => {
    ['--tracking-tighter', '--tracking-tight', '--tracking-normal', '--tracking-wide'].forEach(t => {
      expect(cssContent).toContain(t);
    });
  });

  it('should define line height tokens', () => {
    ['--leading-none', '--leading-tight', '--leading-normal', '--leading-relaxed'].forEach(t => {
      expect(cssContent).toContain(t);
    });
  });
});

describe('Design Tokens - Shadows', () => {
  const shadowTokens = ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-glow', '--shadow-glow-lg'];

  shadowTokens.forEach(token => {
    it(`should define ${token}`, () => {
      expect(cssContent).toContain(token);
    });
  });

  it('should define dark mode shadow overrides', () => {
    const darkBlock = cssContent.match(/\.dark\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s)?.[1] || '';
    expect(darkBlock).toContain('--shadow-sm');
    expect(darkBlock).toContain('--shadow-glow');
  });
});

describe('Design Tokens - Gradients', () => {
  const gradientTokens = [
    '--gradient-primary', '--gradient-primary-hover',
    '--gradient-success', '--gradient-warning', '--gradient-danger',
    '--gradient-mesh',
  ];

  gradientTokens.forEach(token => {
    it(`should define ${token}`, () => {
      expect(cssContent).toContain(token);
    });
  });
});

describe('Design Tokens - Animation Timing', () => {
  it('should define ease-out-expo', () => {
    expect(cssContent).toContain('--ease-out-expo');
    expect(cssContent).toContain('cubic-bezier');
  });

  it('should define ease-out-back', () => {
    expect(cssContent).toContain('--ease-out-back');
  });

  it('should define ease-spring', () => {
    expect(cssContent).toContain('--ease-spring');
  });
});

describe('Design Tokens - Email Status Colors', () => {
  const statuses = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'pending', 'replied'];

  statuses.forEach(status => {
    it(`should define --email-${status} color`, () => {
      expect(cssContent).toContain(`--email-${status}:`);
    });

    it(`should define --email-${status}-foreground color`, () => {
      expect(cssContent).toContain(`--email-${status}-foreground:`);
    });
  });
});

describe('Design Tokens - Engagement Levels', () => {
  ['hot', 'warm', 'cold'].forEach(level => {
    it(`should define --engagement-${level}`, () => {
      expect(cssContent).toContain(`--engagement-${level}:`);
    });
  });
});

describe('Design Tokens - Sidebar', () => {
  const sidebarTokens = [
    '--sidebar-background', '--sidebar-foreground',
    '--sidebar-primary', '--sidebar-primary-foreground',
    '--sidebar-accent', '--sidebar-accent-foreground',
    '--sidebar-border', '--sidebar-ring',
  ];

  sidebarTokens.forEach(token => {
    it(`should define ${token}`, () => {
      expect(cssContent).toContain(token);
    });
  });
});

describe('Design Tokens - Border Radius', () => {
  it('should define --radius token', () => {
    expect(cssContent).toContain('--radius:');
  });
});
