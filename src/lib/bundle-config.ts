/**
 * Bundle Analyzer Configuration
 * @description Configuração para análise de bundle
 */
import { visualizer } from 'rollup-plugin-visualizer';
import type { PluginOption } from 'vite';

export function bundleAnalyzer(): PluginOption {
  return visualizer({
    filename: 'dist/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true,
  });
}

export const bundleOptimizations = {
  manualChunks: {
    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
    'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    'query-vendor': ['@tanstack/react-query'],
    'chart-vendor': ['recharts'],
  },
};
