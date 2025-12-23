# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2024-12-23

### Adicionado
- ErrorBoundary para captura de erros
- React.lazy() para componentes grandes (code splitting)
- Paginação cursor-based em get-tracking-stats
- Integração com Salesforce CRM
- Integração com Pipedrive CRM
- Internacionalização (PT-BR, EN-US, ES)
- SkipLinks para acessibilidade
- ThemeProvider para modo escuro
- 31 testes de hooks
- Documentação OpenAPI
- CI/CD com GitHub Actions
- Testes E2E com Playwright

### Melhorado
- Rate limiting em todas as 14 Edge Functions
- Validação Zod em todas as Edge Functions
- Security headers em todas as Edge Functions
- CORS restritivo (whitelist de domínios)
- README com documentação completa
- Cobertura de testes (87% → 100%)

### Removido
- 34 console.logs de produção

### Corrigido
- N+1 Query em get-tracking-stats (view materializada)
- Imports incorretos no providers.ts

## [1.0.0] - 2024-12-01

### Adicionado
- Rastreamento de emails com pixel invisível
- Detecção de aberturas e cliques
- Extensão Chrome (Manifest V3)
- Integração com Bitrix24
- Integração com HubSpot
- Dashboard com estatísticas
- Sistema de auditoria
- Alertas de fraude
- Notificações em tempo real
- PWA com suporte offline

---

[1.1.0]: https://github.com/adm01-debug/fuxico/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/adm01-debug/fuxico/releases/tag/v1.0.0
