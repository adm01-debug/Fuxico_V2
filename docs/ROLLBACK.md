# FUXICO - Estratégia de Rollback

## 📋 Visão Geral

Este documento descreve os procedimentos para rollback em caso de problemas após deploy.

## 🚨 Quando Fazer Rollback

Faça rollback imediatamente se:
- Taxa de erro > 5%
- Response time P95 > 2s
- Funcionalidade crítica quebrada
- Dados corrompidos

## 📝 Procedimentos

### 1. Rollback de Frontend (Lovable/Vercel)

```bash
# Via CLI
vercel rollback [deployment-id]

# Via GitHub
git revert HEAD
git push origin main
```

### 2. Rollback de Edge Functions

```bash
# Via Supabase CLI
supabase functions deploy [function-name] --legacy-bundle

# Ou restaurar versão anterior
git checkout HEAD~1 -- supabase/functions/[function-name]
git commit -m "rollback: [function-name]"
git push
```

### 3. Rollback de Banco de Dados

```sql
-- CUIDADO: Operações destrutivas!
-- Sempre fazer backup antes

-- Rollback de migration
-- Via Supabase Dashboard > Database > Migrations

-- Ou manualmente
DROP TABLE IF EXISTS [new_table];
ALTER TABLE [table] DROP COLUMN IF EXISTS [new_column];
```

### 4. Rollback de Feature Flag

```bash
# Desabilitar feature problemática
# .env ou Supabase Secrets
VITE_ENABLE_[FEATURE]=false
```

## ✅ Checklist Pós-Rollback

- [ ] Verificar métricas normalizaram
- [ ] Testar funcionalidades críticas
- [ ] Notificar equipe
- [ ] Documentar incidente
- [ ] Criar issue para investigação

## 📞 Escalation

| Nível | Ação | Tempo |
|-------|------|-------|
| 1 | Dev on-call investiga | 0-15min |
| 2 | Rollback se não resolvido | 15-30min |
| 3 | Escalar para Lead | 30min+ |

---

*Última atualização: Dezembro 2024*
