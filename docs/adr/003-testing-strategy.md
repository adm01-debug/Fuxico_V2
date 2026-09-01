# ADR-003: Estratégia de Testes

## Status
Aceito

## Data
2025-12-25

## Contexto

O sistema FUXICO precisa de testes automatizados para:

1. Garantir qualidade e estabilidade do código
2. Prevenir regressões em atualizações
3. Documentar comportamento esperado
4. Suportar refatorações seguras
5. Validar integração entre componentes

O projeto iniciou sem testes, representando risco significativo para manutenção e evolução.

## Decisão

Implementamos uma estratégia de testes em **3 níveis**:

### Nível 1: Testes Unitários (Vitest)

**Escopo**: Funções isoladas, hooks, utilitários

**Ferramentas**:
- Vitest (fast, ESM native)
- @testing-library/react
- @testing-library/react-hooks
- MSW (Mock Service Worker)

**Estrutura**:
```
src/
├── __tests__/
│   ├── hooks/
│   │   ├── use-tracking.test.ts
│   │   ├── use-bitrix24.test.ts
│   │   └── ...
│   ├── lib/
│   │   ├── logger.test.ts
│   │   └── ...
│   └── setup.ts
```

**Cobertura Mínima**:
- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

### Nível 2: Testes de Integração (Vitest + Supabase)

**Escopo**: Edge Functions, APIs, fluxos de dados

**Ferramentas**:
- Vitest
- @supabase/supabase-js
- Supabase CLI (local)

**Estrutura**:
```
supabase/functions/
├── _tests/
│   ├── integration-suite.test.ts
│   ├── geo-lookup.test.ts
│   ├── track-pixel.test.ts
│   └── test-utils.ts
├── _shared/
│   ├── cors.test.ts
│   ├── rate-limit.test.ts
│   └── schemas.test.ts
```

**Ambiente**:
- Supabase local via Docker
- Banco de dados de teste isolado
- Cleanup automático após testes

### Nível 3: Testes E2E (Playwright)

**Escopo**: Fluxos críticos de usuário

**Ferramentas**:
- Playwright
- Multiple browsers (Chromium, Firefox, WebKit)

**Estrutura**:
```
e2e/
├── tests/
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── tracking.spec.ts
└── auth.setup.ts
```

**Fluxos Cobertos**:
1. Login/Logout
2. Criação de rastreamento
3. Visualização de estatísticas
4. Exportação de dados
5. Configurações de usuário

### Configuração CI/CD

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
  
  e2e:
    steps:
      - run: npx playwright install
      - run: npm run test:e2e
  
  integration:
    steps:
      - run: supabase start
      - run: npm run test:integration
```

## Consequências

### Positivas

- **Confiança**: Mudanças validadas automaticamente
- **Documentação**: Testes como especificação viva
- **Refatoração**: Segurança para melhorias
- **Onboarding**: Novos devs entendem o sistema via testes
- **CI/CD**: Feedback rápido em PRs

### Negativas

- **Tempo de CI**: ~5 minutos (mitigado com cache)
- **Manutenção**: Mocks precisam ser atualizados
- **Setup inicial**: Investimento de tempo significativo
- **Flaky tests**: E2E pode ser instável (mitigado com retries)

### Trade-offs

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| Coverage | 70% | Balanceia qualidade vs esforço |
| E2E browsers | 3 | Cobertura cross-browser |
| Mocks vs Real | Híbrido | Unit=mock, Integration=real |
| Paralelização | Sim | Reduz tempo de CI |

## Métricas de Sucesso

- Cobertura > 70%
- CI time < 10 minutos
- Flaky test rate < 2%
- Bug escape rate < 5%

## Comandos

```bash
# Unitários
npm run test              # Watch mode
npm run test:coverage     # Com cobertura

# Integração
npm run test:integration  # Requer Supabase local

# E2E
npm run test:e2e          # Headless
npm run test:e2e:ui       # Com UI
```

## Referências

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Kent C. Dodds - Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

*Última atualização: 2025-12-25*
