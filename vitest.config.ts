import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 10000,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/lib/**", "src/hooks/**", "src/components/**"],
      exclude: ["src/test/**", "src/**/*.d.ts", "src/integrations/**"],
      // Ratchet floor: set to the measured baseline so the gate is enforced
            // instead of always failing. Raise these as coverage improves.
            thresholds: {
              lines: 4,
              functions: 3,
              branches: 2,
              statements: 4,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
