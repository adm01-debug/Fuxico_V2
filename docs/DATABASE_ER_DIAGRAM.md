# 📊 Entity Relationship Diagram (ERD) — FUXICO

```mermaid
erDiagram
    USERS ||--o{ TRACKED_EMAILS : "possui"
    USERS ||--o{ TRACKED_LINKS : "possui"
    USERS ||--o{ TRACKED_DOCUMENTS : "possui"
    USERS ||--o{ USER_ROLES : "tem"
    
    TRACKED_EMAILS ||--o{ TRACKING_EVENTS : "gera"
    TRACKED_EMAILS ||--o{ FOLLOW_UP_REMINDERS : "tem"
    
    TRACKED_LINKS ||--o{ TRACKING_EVENTS : "gera"
    
    TRACKED_DOCUMENTS ||--o{ TRACKING_EVENTS : "gera"
    
    USER_ROLES }o--|| ROLES : "pertence"
    ROLES ||--o{ ROLE_PERMISSIONS : "define"
    ROLE_PERMISSIONS }o--|| PERMISSIONS : "concede"
    
    SECURITY_EVENTS }o--|| USERS : "registra"
    FRAUD_ALERTS }o--|| USERS : "alerta"
    FRAUD_ALERTS |o--|| EMAIL_AUDIT_LOGS : "referencia"
```

## Descrição dos Domínios

1. **Auth & Security:** Gerenciamento de usuários, roles (RBAC), logs de segurança e alertas de fraude.
2. **Tracking:** Core do sistema. Emails, links e documentos rastreados e seus respectivos eventos de abertura/clique.
3. **Automation:** Lembretes de follow-up e sequências de email.
4. **Configuration:** Preferências de usuário, whitelists e filtros salvos.
