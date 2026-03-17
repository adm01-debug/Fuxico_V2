import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  cacheDir: "node_modules/.vite-v3",
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
    force: true,
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query'],
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "query-vendor": ["@tanstack/react-query"],
          "chart-vendor": ["recharts"],
          "date-vendor": ["date-fns"],
          "utils-vendor": ["clsx", "tailwind-merge", "class-variance-authority"],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production",
      },
    },
  },
}));
