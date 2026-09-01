// =============================================================================
// FUXICO - Toast & Notification System Tests
// Validates toaster component, sonner config, and visual variants
// =============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const toasterContent = fs.readFileSync(
  path.resolve(__dirname, '../../components/ui/toaster.tsx'),
  'utf-8'
);

const sonnerContent = fs.readFileSync(
  path.resolve(__dirname, '../../components/ui/sonner.tsx'),
  'utf-8'
);

describe('Toaster Component', () => {
  it('should import CheckCircle2 icon for success', () => {
    expect(toasterContent).toContain('CheckCircle2');
  });

  it('should import AlertCircle icon for errors', () => {
    expect(toasterContent).toContain('AlertCircle');
  });

  it('should define variant icons mapping', () => {
    expect(toasterContent).toContain('variantIcons');
  });

  it('should render icon based on variant', () => {
    expect(toasterContent).toContain("variant === \"destructive\"");
  });

  it('should render icon with proper spacing', () => {
    expect(toasterContent).toContain('flex gap-3');
  });

  it('should include ToastClose button', () => {
    expect(toasterContent).toContain('ToastClose');
  });

  it('should include ToastViewport', () => {
    expect(toasterContent).toContain('ToastViewport');
  });

  it('should support title and description', () => {
    expect(toasterContent).toContain('ToastTitle');
    expect(toasterContent).toContain('ToastDescription');
  });

  it('should support action slot', () => {
    expect(toasterContent).toContain('{action}');
  });
});

describe('Sonner Component', () => {
  it('should use bottom-right position', () => {
    expect(sonnerContent).toContain('position="bottom-right"');
  });

  it('should enable richColors', () => {
    expect(sonnerContent).toContain('richColors');
  });

  it('should enable closeButton', () => {
    expect(sonnerContent).toContain('closeButton');
  });

  it('should not expand by default', () => {
    expect(sonnerContent).toContain('expand={false}');
  });

  it('should use theme from context', () => {
    expect(sonnerContent).toContain('useTheme');
    expect(sonnerContent).toContain('theme=');
  });

  it('should style success toasts with green', () => {
    expect(sonnerContent).toContain('green-500');
  });

  it('should style error toasts with destructive', () => {
    expect(sonnerContent).toContain('destructive');
  });

  it('should style warning toasts with yellow', () => {
    expect(sonnerContent).toContain('yellow-500');
  });

  it('should style info toasts with blue', () => {
    expect(sonnerContent).toContain('blue-500');
  });

  it('should use rounded-xl for toast shape', () => {
    expect(sonnerContent).toContain('rounded-xl');
  });

  it('should use rounded-lg for buttons', () => {
    expect(sonnerContent).toContain('rounded-lg');
  });

  it('should apply shadow-xl', () => {
    expect(sonnerContent).toContain('shadow-xl');
  });

  it('should use semantic bg-background token', () => {
    expect(sonnerContent).toContain('bg-background');
  });

  it('should use semantic text-foreground token', () => {
    expect(sonnerContent).toContain('text-foreground');
  });

  it('should use semantic border-border token', () => {
    expect(sonnerContent).toContain('border-border');
  });

  it('should export toast function', () => {
    expect(sonnerContent).toContain('export { Toaster, toast }');
  });
});
