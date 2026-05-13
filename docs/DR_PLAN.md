# 🛡️ Disaster Recovery (DR) Plan — FUXICO

## 1. Estratégia de Backup
- **PostgreSQL:** Backups contínuos (WAL-G) + Point-in-Time Recovery (PITR) via Supabase.
- **Storage:** Cross-region replication ativado para o bucket `tracked-documents`.
- **Configuração:** Secrets armazenados no Supabase Vault e Lovable Cloud.

## 2. Cenários de Falha

### A. Queda total da região Supabase
- **Ação:** Provisionar novo projeto em região alternativa (ex: US-East-1 → SA-East-1).
- **RTO (Recovery Time Objective):** 4 horas.
- **RPO (Recovery Point Objective):** 5 minutos (PITR).

### B. Corrupção de Dados (Erro Humano)
- **Ação:** Restaurar banco para timestamp anterior via PITR.
- **RTO:** 1 hora.
- **RPO:** Timestamp do erro - 1 min.

## 3. Procedimento de Restore
1. Acessar painel Supabase → Database → Backups.
2. Selecionar "Restore to point in time".
3. Definir o timestamp desejado.
4. Validar integridade dos dados após restore.
5. Atualizar DNS/Secrets se o projeto mudar de ID.

## 4. Teste de Restore
- **Frequência:** Trimestral.
- **Responsável:** Time de DevOps/SRE.
- **Critério de Aceite:** Dados de 10 usuários randômicos batem com o backup.
