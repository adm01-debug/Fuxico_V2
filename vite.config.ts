import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: "node_modules/.vite-v5",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html in build
    mode === "production" &&
      (visualizer({
        filename: "dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption),
    // Gzip compression
    mode === "production" &&
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 1024,
      }),
    // Brotli compression
    mode === "production" &&
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024,
      }),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query', 'react-router-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query'],
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: mode !== "production",
    cssMinify: true,
    assetsInlineLimit: 4096, // inline assets < 4KB as base64
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - loaded first
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI framework - loaded on demand via components
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
          ],
          // Data layer
          "query-vendor": ["@tanstack/react-query"],
          // Heavy libs - separate chunks for parallel loading
          "animation-vendor": ["framer-motion"],
          "chart-vendor": ["recharts"],
          "date-vendor": ["date-fns"],
          "i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          "utils-vendor": ["clsx", "tailwind-merge", "class-variance-authority", "zod"],
          // Supabase SDK
          "supabase-vendor": ["@supabase/supabase-js"],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production",
        passes: 2, // extra compression pass
        pure_getters: true,
        unsafe_arrows: true,
      },
      mangle: {
        safari10: true,
      },
    },
  },
}));
