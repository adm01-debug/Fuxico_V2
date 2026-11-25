import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: "node_modules/.vite-v5",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'FUXICO - Rastreamento de Emails',
        short_name: 'FUXICO',
        description: 'Saiba quando seus emails são lidos.',
        theme_color: '#6366f1',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
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
        // Rolldown (Vite 8) requires manualChunks to be a function, not an object
                manualChunks: (id: string) => {
                  if (!id.includes("node_modules")) return;
                  // i18n first: react-i18next must not fall into react-vendor
                  if (/node_modules\/(i18next|i18next-browser-languagedetector|react-i18next)\//.test(id))
                    return "i18n-vendor";
          // Core React - loaded first
                  if (/node_modules\/(react-dom|react-router-dom|react)\//.test(id)) return "react-vendor";
          // UI framework - loaded on demand via components
                  if (
                    /node_modules\/@radix-ui\/react-(dialog|dropdown-menu|select|tabs|tooltip|popover|accordion)\//.test(
                      id,
                    )
                  )
                    return "ui-vendor";
          // Data layer
                  if (/node_modules\/@tanstack\/react-query\//.test(id)) return "query-vendor";
          // Heavy libs - separate chunks for parallel loading
                  if (/node_modules\/framer-motion\//.test(id)) return "animation-vendor";
                  if (/node_modules\/recharts\//.test(id)) return "chart-vendor";
                  if (/node_modules\/date-fns\//.test(id)) return "date-vendor";
                  if (/node_modules\/(clsx|class-variance-authority|tailwind-merge|zod)\//.test(id))
                    return "utils-vendor";
          // Supabase SDK
                  if (/node_modules\/@supabase\/supabase-js\//.test(id)) return "supabase-vendor";
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
