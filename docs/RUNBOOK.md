# FUXICO - Runbook de Operações

## 🚨 Procedimentos de Emergência

### Aplicação Fora do Ar
1. Verificar status do Supabase: https://status.supabase.com
2. Verificar logs no dashboard Supabase
3. Verificar se há deploys recentes no Lovable
4. Rollback se necessário (ver seção Rollback)

### Alta Latência
1. Verificar Edge Functions no dashboard Supabase
2. Verificar se há queries lentas no Query Performance
3. Verificar se a view materializada está atualizada
4. Forçar refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY email_stats_mv;`

### Erros de Autenticação
1. Verificar configuração OAuth no Supabase
2. Verificar tokens JWT expirados
3. Limpar cache do navegador do usuário

## 🔄 Rollback

### Via Lovable
1. Acessar dashboard do Lovable
2. Ir em "Deployments"
3. Selecionar versão anterior estável
4. Clicar em "Rollback"

### Via Supabase (Edge Functions)
1. Acessar dashboard Supabase
2. Ir em "Edge Functions"
3. Selecionar função problemática
4. Restaurar versão anterior via CLI:
   ```bash
   supabase functions deploy <function-name> --version <version>
   ```

## 📊 Monitoramento

### Métricas Chave
- **Tempo de resposta**: < 200ms (P95)
- **Taxa de erro**: < 0.1%
- **Uptime**: > 99.9%

### Dashboards
- Supabase Dashboard: Edge Functions, Database, Auth
- Sentry: Erros de aplicação
- Codecov: Cobertura de testes

## 🔧 Manutenção

### Semanal
- [ ] Verificar atualizações de dependências (Dependabot)
- [ ] Revisar alertas de segurança
- [ ] Verificar uso de recursos

### Mensal
- [ ] Refresh da view materializada
- [ ] Limpeza de logs antigos
- [ ] Análise de performance

### Contatos de Emergência
- Supabase Support: support@supabase.io
- Lovable Support: via Discord

