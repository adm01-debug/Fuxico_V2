import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      sonarjs.configs.recommended
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // TypeScript strict rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Security-related rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // Quality rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      // Limiar de complexidade cognitiva calibrado para componentes de dashboard
      // com múltiplos estados de carregamento/erro (padrão do Sonar = 15).
      "sonarjs/cognitive-complexity": ["error", 25],
    },
  },
  {
    // Camada de apresentação (JSX): ternários encadeados são idiomáticos para
    // seleção de variante/ícone. Mantemos como aviso para não mascarar lógica
    // de negócio, que continua sob regra de erro nos arquivos .ts.
    files: ["**/*.tsx"],
    rules: {
      "sonarjs/no-nested-conditional": "warn",
    },
  },
  {
    // Testes, mocks e fixtures: IPs/URLs/aleatoriedade são dados sintéticos.
    files: [
      "**/__tests__/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "src/test/**/*.{ts,tsx}",
      "e2e/**/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
    ],
    rules: {
      "sonarjs/no-hardcoded-ip": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/no-identical-expressions": "off",
      "sonarjs/no-empty-collection": "off",
      "sonarjs/assertions-in-tests": "off",
      "sonarjs/slow-regex": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/regex-complexity": "off",
      "sonarjs/concise-regex": "off",
      "sonarjs/single-character-alternation": "off",
      "sonarjs/prefer-single-boolean-return": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-control-regex": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  {
    // Camada de logging/telemetria: é o único lugar autorizado a tocar o
    // console diretamente — todo o resto do app deve usar `@/lib/logger`.
    files: ["src/lib/logger.ts", "src/lib/sentry.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Primitivos shadcn/ui: por convenção da biblioteca cada arquivo exporta o
    // componente junto com suas variantes CVA / hook interno. Reescrevê-los
    // quebraria a compatibilidade com upstream, então o aviso de Fast Refresh
    // é desativado apenas nesta camada.
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.cjs", "scripts/**/*.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Scripts de build/seed rodam em CLI: o console é a interface de saída
    // legítima desses utilitários, que nunca são carregados pelo app.
    files: ["scripts/**/*.{ts,js,cjs}"],
    rules: {
      "no-console": "off",
    },
  },

);
